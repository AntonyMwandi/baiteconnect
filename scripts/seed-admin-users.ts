// scripts/seed-admin-users.ts
// Creates the initial executive and admin accounts for BaiteConnect
// Run ONCE after database setup: npx tsx scripts/seed-admin-users.ts
//
// IMPORTANT: Change these phone numbers to the real numbers before running in production.
// Each account is verified via OTP on first login — no passwords are stored.

import { PrismaClient } from '@prisma/client'
import crypto           from 'crypto'

const prisma = new PrismaClient()

interface AdminAccount {
  fullName:    string
  phoneNumber: string
  nationalId:  string
  role:        'GOVERNOR_EXEC' | 'COUNTY_ADMIN' | 'MCA'
  note:        string
}

// ── Configure these before running ───────────────────────────
const ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    fullName:   'Isaac Mutuma M\'Ethingia',
    phoneNumber:'+254702224343',
    nationalId: '10000001',
    role:       'GOVERNOR_EXEC',
    note:       'Governor\'s Office — Full executive access',
  },
  {
    fullName:   'CECM Finance & ICT',
    phoneNumber:'+254700099922',
    nationalId: '10000002',
    role:       'COUNTY_ADMIN',
    note:       'CECM for Finance — Administrative access',
  },
  {
    fullName:   'Chief Officer Economic Planning',
    phoneNumber:'+254733322212',
    nationalId: '10000003',
    role:       'COUNTY_ADMIN',
    note:       'Chief Officer for Economic Planning',
  },
  {
    fullName:   'County ICT Administrator',
    phoneNumber:'+254744412324',
    nationalId: '10000004',
    role:       'COUNTY_ADMIN',
    note:       'County ICT Department — System administrator',
  },
  {
    fullName:   'MCA Municipality Ward',
    phoneNumber:'+254754544010',
    nationalId: '10000010',
    role:       'MCA',
    note:       'MCA Municipality Ward — North Imenti',
  },
  {
    fullName:   'MCA Timau Ward',
    phoneNumber:'+254765653011',
    nationalId: '10000011',
    role:       'MCA',
    note:       'MCA Timau Ward — North Imenti',
  },
  {
    fullName:   'MCA Muthara Ward',
    phoneNumber:'+254776767612',
    nationalId: '10000012',
    role:       'MCA',
    note:       'MCA Muthara Ward — Tigania East',
  },
  {
    fullName:   'MCA Nkuene Ward',
    phoneNumber:'+254709090913',
    nationalId: '10000013',
    role:       'MCA',
    note:       'MCA Nkuene Ward — North Imenti',
  },
  {
    fullName:   'MCA Maua Ward',
    phoneNumber:'+254789898914',
    nationalId: '10000014',
    role:       'MCA',
    note:       'MCA Maua Ward — Igembe Central',
  },
]

async function main() {
  console.log('\n🔐  Seeding BaiteConnect admin accounts...\n')

  for (const account of ADMIN_ACCOUNTS) {
    const nationalIdHash = crypto
      .createHash('sha256')
      .update(account.nationalId)
      .digest('hex')

    const existing = await prisma.user.findFirst({
      where: { OR: [{ phoneNumber: account.phoneNumber }, { nationalIdHash }] },
    })

    if (existing) {
      // Update role if already exists
      await prisma.user.update({
        where: { id: existing.id },
        data:  { role: account.role, fullName: account.fullName, isPhoneVerified: true },
      })
      console.log(`🔄  Updated: ${account.fullName} (${account.role})`)
      continue
    }

    await prisma.user.create({
      data: {
        nationalId:      account.nationalId,
        nationalIdHash,
        phoneNumber:     account.phoneNumber,
        fullName:        account.fullName,
        role:            account.role,
        isPhoneVerified: true, // Pre-verified — first login via OTP will re-verify
      },
    })

    console.log(`✅  Created: ${account.fullName}`)
    console.log(`   Role:    ${account.role}`)
    console.log(`   Phone:   ${account.phoneNumber}`)
    console.log(`   Note:    ${account.note}\n`)
  }

  console.log('─'.repeat(60))
  console.log('\n✅  Admin accounts seeded successfully.\n')
  console.log('NEXT STEPS:')
  console.log('1. Update phone numbers in scripts/seed-admin-users.ts to real numbers')
  console.log('2. Run: npx tsx scripts/seed-admin-users.ts')
  console.log('3. Each admin logs in via OTP at: /admin/login')
  console.log('4. No passwords are used — authentication is phone-OTP only')
  console.log('\nADMIN LOGIN FLOW:')
  console.log('• Navigate to baiteconnect.meru.go.ke/admin/login')
  console.log('• Enter registered phone number')
  console.log('• Receive 6-digit OTP via Africa\'s Talking SMS')
  console.log('• Enter code → session created → redirected to dashboard')
  console.log('\nRole access levels:')
  console.log('• GOVERNOR_EXEC → Full read access to all admin sections')
  console.log('• COUNTY_ADMIN  → Full read + write access to all sections')
  console.log('• MCA           → Access to own proposals + executive briefing\n')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
