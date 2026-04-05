export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#000000', color: '#ffffff' }}>
      {children}
    </div>
  );
}
