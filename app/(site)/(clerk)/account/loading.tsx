/** Mirrors the account page (heading, then label-and-panel sections) while the server reads D1. */
export default function AccountLoading() {
  return (
    <div className="page-frame pt-12 pb-8 sm:pt-20" aria-busy="true" aria-label="Loading your account">
      <div className="pb-10">
        <div className="h-4 w-20 rounded-control bg-raised" />
        <div className="mt-4 h-10 w-64 rounded-control bg-raised sm:h-16 sm:w-96" />
        <div className="mt-4 h-5 w-72 max-w-full rounded-control bg-raised" />
      </div>
      {[0, 1, 2].map((index) => (
        <div key={index} className="grid gap-6 border-t border-hairline py-10 lg:grid-cols-12 lg:py-12">
          <div className="lg:col-span-4">
            <div className="h-6 w-32 rounded-control bg-raised" />
            <div className="mt-3 h-4 w-60 max-w-full rounded-control bg-raised" />
          </div>
          <div className="h-48 rounded-card border border-hairline bg-surface lg:col-span-8" />
        </div>
      ))}
    </div>
  );
}
