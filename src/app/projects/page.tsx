// src/app/projects/page.tsx
import type { Metadata } from 'next'
import prisma            from '@/lib/prisma'
import ProjectCard       from '@/components/dashboard/ProjectCard'
import { SectionHeader, EmptyState } from '@/components/ui'
import type { ProjectWithReports }   from '@/types'

export const metadata: Metadata = {
  title: 'Projects — BaiteConnect Meru County',
  description: 'Track delivery of funded county projects and report issues with geo-tagged evidence.',
}

export const revalidate = 60 // ISR: refresh every 60s

async function getProjects(): Promise<ProjectWithReports[]> {
  const raw = await prisma.project.findMany({
    include: {
      ward:         { select: { wardName: true, subCounty: true } },
      stageHistory: { orderBy: { createdAt: 'asc' } },
      _count:       { select: { whistleReports: { where: { status: { not: 'RESOLVED' } } } } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return raw.map(p => ({
    ...p,
    allocatedBudget: Number(p.allocatedBudget),
    description:     p.description ?? null,
    contractorName:  p.contractorName ?? null,
    latitude:        p.latitude ?? null,
    longitude:       p.longitude ?? null,
    stageHistory:    p.stageHistory.map(h => ({
      id:        h.id,
      stage:     h.stage,
      notes:     h.notes ?? null,
      updatedBy: h.updatedBy ?? null,
      createdAt: h.createdAt,
    })),
  }))
}

export default async function ProjectsPage() {
  const projects = await getProjects()

  const byStage = {
    ALLOCATED: projects.filter(p => p.currentStage === 'ALLOCATED'),
    TENDERED:  projects.filter(p => p.currentStage === 'TENDERED'),
    ONGOING:   projects.filter(p => p.currentStage === 'ONGOING'),
    COMPLETED: projects.filter(p => p.currentStage === 'COMPLETED'),
  }

  const stageGroups = [
    { key: 'ONGOING',   label: '🔨 Ongoing',       color: '#c8960c', projects: byStage.ONGOING },
    { key: 'TENDERED',  label: '📋 Tender Awarded', color: '#2563eb', projects: byStage.TENDERED },
    { key: 'ALLOCATED', label: '📁 Allocated',      color: '#6b7280', projects: byStage.ALLOCATED },
    { key: 'COMPLETED', label: '✅ Completed',      color: '#01411C', projects: byStage.COMPLETED },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
      <SectionHeader
        title="Project Delivery Tracker"
        subtitle="Live status of all funded county projects. Use the whistleblower button to report delivery issues — a geo-tagged photo is required."
      />

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stageGroups.map(g => (
          <div key={g.key} className="bg-white rounded-xl border border-gray-100 shadow-card p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: g.color }}>{g.projects.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">{g.label}</p>
          </div>
        ))}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon="🏗️"
          title="No projects yet"
          description="County projects will appear here once added by the administration team."
        />
      ) : (
        <div className="space-y-10">
          {stageGroups.filter(g => g.projects.length > 0).map(group => (
            <section key={group.key}>
              <h2 className="text-base font-bold text-neutralDark mb-4 flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: group.color }}
                />
                {group.label}
                <span className="text-sm font-normal text-gray-400">({group.projects.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {group.projects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    // userId / userPhone from client-side session would be passed here
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
