export default function TestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div>
          <h1>Test App</h1>
          {children}
        </div>
      </body>
    </html>
  )
}
