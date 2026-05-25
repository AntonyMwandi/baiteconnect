// src/components/ui/skeletons.tsx
// Page-level loading skeletons for BaiteConnect

export function HomePageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10 space-y-8 animate-pulse">
      <div className="h-64 bg-gray-200 rounded-3xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-4">
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="h-24 bg-gray-200 rounded-2xl" />
          <div className="h-20 bg-gray-200 rounded-2xl" />
        </div>
        <div className="h-96 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  )
}

export function ProjectsPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded-xl w-64 mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-200 rounded-2xl" />)}
      </div>
      {[1,2,3].map(i => (
        <div key={i} className="h-40 bg-gray-200 rounded-2xl" />
      ))}
    </div>
  )
}

export function LeaderboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-pulse">
      <div className="h-10 bg-gray-200 rounded-xl w-64 mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-200 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="h-[600px] bg-gray-200 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="h-32 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

export function AdminSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-pulse">
      <div className="h-32 bg-gray-200 rounded-2xl mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-gray-200 rounded-2xl mb-4" />
      <div className="h-96 bg-gray-200 rounded-2xl" />
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="max-w-md mx-auto space-y-4 animate-pulse p-6">
      <div className="h-8 bg-gray-200 rounded-xl w-48" />
      {[1,2,3,4,5].map(i => (
        <div key={i} className="space-y-1.5">
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-11 bg-gray-200 rounded-xl" />
        </div>
      ))}
      <div className="h-12 bg-gray-200 rounded-xl" />
    </div>
  )
}
