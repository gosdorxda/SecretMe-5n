export default function NotFound() {
  return (
    <html>
      <head>
        <title>404 - Halaman Tidak Ditemukan</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            text-align: center;
            background-color: #f9fafb;
          }
          .container {
            max-width: 28rem;
            padding: 2rem;
          }
          h1 {
            font-size: 3.75rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: #111827;
          }
          h2 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            color: #374151;
          }
          p {
            margin-bottom: 2rem;
            color: #6b7280;
          }
          .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            font-weight: 500;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            text-decoration: none;
            transition: background-color 0.2s;
          }
          .button:hover {
            background-color: #1d4ed8;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1>404</h1>
          <h2>Halaman Tidak Ditemukan</h2>
          <p>Maaf, halaman yang Anda cari tidak ditemukan. Halaman mungkin telah dipindahkan atau dihapus.</p>
          <a href="/" className="button">
            Kembali ke Beranda
          </a>
        </div>
      </body>
    </html>
  )
}
