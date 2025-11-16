import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/LM.png" />
        <link rel="apple-touch-icon" href="/LM.png" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <body className="antialiased font-sans">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
