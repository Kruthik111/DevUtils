export default function ExtensionPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Extension</h1>
        <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-xl">
          <button className="px-6 py-3 bg-primary text-background rounded-xl hover:bg-primary/90 transition-all">
            Download Extension
          </button>
        </div>
      </div>
    </div>
  );
}

