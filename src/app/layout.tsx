// Root layout — required by Next.js App Router.
// Actual HTML structure is handled by route-group layouts:
// - (main)/[locale]/layout.tsx — i18n-enabled app layout
// - (public)/layout.tsx — public pages layout

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
