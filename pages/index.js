export default function Home() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Unicode Conversion Tool (UCC)</h1>
      <p>A tool for converting between different Unicode encodings.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Supported Conversions:</h2>
        <ul>
          <li>ASCII to UTF-16LE</li>
          <li>UTF-8 to UTF-16LE</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Features:</h2>
        <ul>
          <li>Secure conversion with input validation</li>
          <li>File size limits (100MB)</li>
          <li>Error handling</li>
          <li>Command-line interface</li>
        </ul>
      </div>
    </div>
  );
}