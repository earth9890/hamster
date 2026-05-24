export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-graphite-950">
      {children}
    </div>
  );
}
