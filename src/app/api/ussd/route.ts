// src/app/api/ussd/route.ts
// POST /api/ussd — Africa's Talking USSD webhook handler
// Processes *384# requests from feature phones across all networks

import { NextRequest, NextResponse } from 'next/server'
import prisma                        from '@/lib/prisma'
import { CURRENT_FISCAL_YEAR }       from '@/types'

// USSD session text is built from menuPath
// sessionId identifies the ongoing USSD session
// phoneNumber is the caller's Kenyan number
// text is the accumulated user input (e.g. "1*2*3")

interface UssdPayload {
  sessionId:   string
  serviceCode: string
  phoneNumber: string
  text:        string
  networkCode?: string
}

// ── Menu builder helpers ──────────────────────────────────────
const CON = (text: string) => `CON ${text}` // Continue — show menu, expect input
const END = (text: string) => `END ${text}` // End session — display message, close

// ── Main handler ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let payload: UssdPayload

  // Africa's Talking sends form-encoded data
  try {
    const body  = await request.text()
    const params = new URLSearchParams(body)
    payload = {
      sessionId:   params.get('sessionId')   ?? '',
      serviceCode: params.get('serviceCode') ?? '',
      phoneNumber: params.get('phoneNumber') ?? '',
      text:        params.get('text')        ?? '',
      networkCode: params.get('networkCode') ?? undefined,
    }
  } catch {
    return new NextResponse('CON Error processing request', { status: 200, headers: { 'Content-Type': 'text/plain' } })
  }

  const { phoneNumber, text } = payload
  const steps = text.split('*').filter(Boolean)
  const depth = steps.length

  let response = ''

  // ── LEVEL 0: Main menu ────────────────────────────────────
  if (depth === 0) {
    response = CON(
      'BaiteConnect - Meru County\n' +
      'Karibu! Welcome!\n\n' +
      '1. Check my ward ranking\n' +
      '2. View budget breakdown\n' +
      '3. Check project status\n' +
      '4. View my submission\n' +
      '5. About BaiteConnect\n' +
      '0. Exit'
    )
  }

  // ── LEVEL 1: Branch by first choice ───────────────────────
  else if (depth === 1) {
    const choice = steps[0]

    // ── 1. Ward ranking ──────────────────────────────────────
    if (choice === '1') {
      response = CON(
        'Ward Rankings - Select sub-county:\n' +
        '1. Igembe North\n' +
        '2. Igembe Central\n' +
        '3. Igembe South\n' +
        '4. Tigania West\n' +
        '5. Tigania East\n' +
        '6. Central Imenti\n' +
        '7. North Imenti\n' +
        '8. South Imenti\n' +
        '9. Buuri\n' +
        '0. Back'
      )
    }

    // ── 2. Budget breakdown ──────────────────────────────────
    else if (choice === '2') {
      try {
        const budgets = await prisma.fiscalYearBudget.findMany({
          where:   { fiscalYear: CURRENT_FISCAL_YEAR, isActive: true },
          orderBy: { shillingsPerHundred: 'desc' },
        })

        const lines = budgets.map(b =>
          `${b.sectorName.substring(0, 16)}: KSh ${b.shillingsPerHundred}`
        ).join('\n')

        response = END(
          `County Budget FY ${CURRENT_FISCAL_YEAR}\n` +
          `Per KSh 100 spent:\n\n` +
          lines + '\n\n' +
          'Visit baiteconnect.meru.go.ke for full details.'
        )
      } catch {
        response = END('Budget data unavailable. Visit baiteconnect.meru.go.ke')
      }
    }

    // ── 3. Project status ────────────────────────────────────
    else if (choice === '3') {
      response = CON(
        'Project Status:\n' +
        '1. Ongoing projects\n' +
        '2. Completed projects\n' +
        '3. Projects under audit\n' +
        '0. Back'
      )
    }

    // ── 4. My submission ─────────────────────────────────────
    else if (choice === '4') {
      try {
        const normalised = phoneNumber.startsWith('+') ? phoneNumber : '+254' + phoneNumber.slice(1)
        const user       = await prisma.user.findUnique({ where: { phoneNumber: normalised } })

        if (!user) {
          response = END(
            'No account found for this number.\n' +
            'To submit a memo, visit:\n' +
            'baiteconnect.meru.go.ke'
          )
        } else {
          const latestMemo = await prisma.memorandum.findFirst({
            where:   { userId: user.id, fiscalYear: CURRENT_FISCAL_YEAR },
            include: { ward: { select: { wardName: true } } },
            orderBy: { createdAt: 'desc' },
          })

          if (!latestMemo) {
            response = END(
              `Hello ${user.fullName.split(' ')[0]}!\n\n` +
              `No memo found for FY ${CURRENT_FISCAL_YEAR}.\n` +
              'Visit baiteconnect.meru.go.ke to submit.'
            )
          } else {
            const status = latestMemo.moderationStatus === 'SHADOW_BANNED'
              ? 'PENDING'
              : latestMemo.moderationStatus
            response = END(
              `Memo: ${latestMemo.referenceCode}\n` +
              `Ward: ${latestMemo.ward.wardName}\n` +
              `Sector: ${latestMemo.sectorCategory}\n` +
              `Status: ${status}\n` +
              `FY: ${latestMemo.fiscalYear}`
            )
          }
        }
      } catch {
        response = END('Service unavailable. Try again later.')
      }
    }

    // ── 5. About ─────────────────────────────────────────────
    else if (choice === '5') {
      response = END(
        'BaiteConnect\n' +
        'County Government of Meru\n\n' +
        'A digital public participation portal for all 45 wards of Meru County.\n\n' +
        'Web: baiteconnect.meru.go.ke\n' +
        'Email: budget.finance@meru.go.ke\n' +
        'Constitution Art. 201 | PFM Act 2012'
      )
    }

    // ── 0. Exit ───────────────────────────────────────────────
    else if (choice === '0') {
      response = END('Thank you for using BaiteConnect.\nAsante kwa kutumia BaiteConnect.')
    }

    else {
      response = CON('Invalid option. Press 0 to go back.')
    }
  }

  // ── LEVEL 2: Sub-menus ─────────────────────────────────────
  else if (depth === 2) {
    const [main, sub] = steps

    // Ward rankings by sub-county
    if (main === '1') {
      const subCountyMap: Record<string, string> = {
        '1': 'Igembe North',   '2': 'Igembe Central', '3': 'Igembe South',
        '4': 'Tigania West',   '5': 'Tigania East',   '6': 'Central Imenti',
        '7': 'North Imenti',   '8': 'South Imenti',   '9': 'Buuri',
      }
      const subCountyName = subCountyMap[sub]

      if (sub === '0') {
        response = CON(
          'BaiteConnect - Meru County\n\n' +
          '1. Check my ward ranking\n' +
          '2. View budget breakdown\n' +
          '3. Check project status\n' +
          '4. View my submission\n' +
          '0. Exit'
        )
      } else if (subCountyName) {
        try {
          const wards = await prisma.ward.findMany({
            where:   { subCounty: subCountyName },
            include: { _count: { select: { memoranda: { where: { fiscalYear: CURRENT_FISCAL_YEAR } } } } },
          })

          const sorted = wards.sort((a, b) => b._count.memoranda - a._count.memoranda)
          const lines  = sorted.map((w, i) =>
            `${i + 1}. ${w.wardName}: ${w._count.memoranda}`
          ).slice(0, 6).join('\n')

          response = END(
            `${subCountyName} Rankings\n` +
            `FY ${CURRENT_FISCAL_YEAR}\n\n` +
            lines + '\n\n(submissions count)'
          )
        } catch {
          response = END('Rankings unavailable. Try again.')
        }
      } else {
        response = CON('Invalid option.\n\n0. Back')
      }
    }

    // Project status sub-menu
    else if (main === '3') {
      const stageMap: Record<string, string> = {
        '1': 'ONGOING',
        '2': 'COMPLETED',
        '3': 'UNDER_AUDIT',
      }

      if (sub === '0') {
        response = CON(
          'BaiteConnect - Meru County\n\n' +
          '1. Check my ward ranking\n' +
          '2. View budget breakdown\n' +
          '3. Check project status\n' +
          '4. View my submission\n' +
          '0. Exit'
        )
      } else {
        try {
          let projects
          if (sub === '3') {
            // Under audit: projects with 3+ active reports
            const allProjects = await prisma.project.findMany({
              include: {
                ward:          { select: { wardName: true } },
                _count:        { select: { whistleReports: { where: { status: { not: 'RESOLVED' } } } } },
              },
            })
            projects = allProjects.filter(p => p._count.whistleReports >= 3)
          } else {
            const stage = stageMap[sub]
            projects = await prisma.project.findMany({
              where:   { currentStage: stage as 'ONGOING' | 'COMPLETED' },
              include: { ward: { select: { wardName: true } } },
              take:    5,
            })
          }

          if (!projects.length) {
            response = END(`No projects found.\n\nVisit baiteconnect.meru.go.ke for details.`)
          } else {
            const lines = projects.slice(0, 4).map(p =>
              `${p.ward.wardName}: ${(p.title || '').substring(0, 20)}...`
            ).join('\n')
            response = END(
              `${sub === '1' ? 'Ongoing' : sub === '2' ? 'Completed' : 'Under Audit'} Projects\n\n` +
              lines + '\n\nFull details:\nbaiteconnect.meru.go.ke/projects'
            )
          }
        } catch {
          response = END('Project data unavailable.')
        }
      }
    }

    else {
      response = CON('Invalid option.\n\n0. Back')
    }
  }

  // ── Fallback ───────────────────────────────────────────────
  else {
    response = END(
      'Session ended.\nThank you for using BaiteConnect.\n' +
      'Dial *384# to restart.'
    )
  }

  return new NextResponse(response, {
    status:  200,
    headers: { 'Content-Type': 'text/plain' },
  })
}
