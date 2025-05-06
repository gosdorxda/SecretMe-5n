interface SocialIconsProps {
  instagramUrl?: string | null
  facebookUrl?: string | null
  linkedinUrl?: string | null
  tiktokUrl?: string | null
}

export function CustomSocialIcons({ instagramUrl, facebookUrl, linkedinUrl, tiktokUrl }: SocialIconsProps) {
  const hasSocialLinks = instagramUrl || facebookUrl || linkedinUrl || tiktokUrl

  if (!hasSocialLinks) return null

  return (
    <div className="flex gap-4 mt-3">
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-600 hover:text-pink-700 transition-colors"
          title="Instagram"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="31" height="31" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c6.6274 0 12 5.3726 12 12s-5.3726 12-12 12S0 18.6274 0 12 5.3726 0 12 0zm3.115 4.5h-6.23c-2.5536 0-4.281 1.6524-4.3805 4.1552L4.5 8.8851v6.1996c0 1.3004.4234 2.4193 1.2702 3.2359.7582.73 1.751 1.1212 2.8818 1.1734l.2633.006h6.1694c1.3004 0 2.389-.4234 3.1754-1.1794.762-.734 1.1817-1.7576 1.2343-2.948l.0056-.2577V8.8851c0-1.2702-.4234-2.3589-1.2097-3.1452-.7338-.762-1.7575-1.1817-2.9234-1.2343l-.252-.0056zM8.9152 5.8911h6.2299c.9072 0 1.6633.2722 2.2076.8166.4713.499.7647 1.1758.8103 1.9607l.0063.2167v6.2298c0 .9375-.3327 1.6936-.877 2.2077-.499.4713-1.176.7392-1.984.7806l-.2237.0057H8.9153c-.9072 0-1.6633-.2722-2.2076-.7863-.499-.499-.7693-1.1759-.8109-2.0073l-.0057-.2306V8.885c0-.9073.2722-1.6633.8166-2.2077.4712-.4713 1.1712-.7392 1.9834-.7806l.2242-.0057h6.2299-6.2299zM12 8.0988c-2.117 0-3.871 1.7238-3.871 3.871A3.8591 3.8591 0 0 0 12 15.8408c2.1472 0 3.871-1.7541 3.871-3.871 0-2.117-1.754-3.871-3.871-3.871zm0 1.3911c1.3609 0 2.4798 1.119 2.4798 2.4799 0 1.3608-1.119 2.4798-2.4798 2.4798-1.3609 0-2.4798-1.119-2.4798-2.4798 0-1.361 1.119-2.4799 2.4798-2.4799zm4.0222-2.3589a.877.877 0 1 0 0 1.754.877.877 0 0 0 0-1.754z" />
          </svg>
        </a>
      )}
      {facebookUrl && (
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 transition-colors"
          title="Facebook"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="31" height="31" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07" />
          </svg>
        </a>
      )}
      {linkedinUrl && (
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 hover:text-blue-800 transition-colors"
          title="LinkedIn"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="31" height="31" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zM8.951 9.404H6.165V17.5H8.95V9.404zm6.841-.192c-1.324 0-1.993.629-2.385 1.156l-.127.181V9.403h-2.786l.01.484c.006.636.007 1.748.005 2.93l-.015 4.683h2.786v-4.522c0-.242.018-.484.092-.657.202-.483.66-.984 1.43-.984.955 0 1.367.666 1.408 1.662l.003.168V17.5H19v-4.643c0-2.487-1.375-3.645-3.208-3.645zM7.576 5.5C6.623 5.5 6 6.105 6 6.899c0 .73.536 1.325 1.378 1.392l.18.006c.971 0 1.577-.621 1.577-1.398C9.116 6.105 8.53 5.5 7.576 5.5z" />
          </svg>
        </a>
      )}
      {tiktokUrl && (
        <a
          href={tiktokUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-black hover:text-gray-800 transition-colors"
          title="TikTok"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="31" height="31" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c6.6274 0 12 5.3726 12 12s-5.3726 12-12 12S0 18.6274 0 12 5.3726 0 12 0Zm3.1623 4h-2.7508v10.9209a2.3324 2.3324 0 0 1-3.0455 2.2209 2.3324 2.3324 0 0 1 1.4129-4.4459V9.8862a5.0812 5.0812 0 0 0-5.7481 5.5912 5.0805 5.0805 0 0 0 3.802 4.3668 5.0818 5.0818 0 0 0 5.423-2.0286c.5899-.8501.9062-1.86.9065-2.8947V9.3345A6.5666 6.5666 0 0 0 19 10.5614V7.83a3.796 3.796 0 0 1-2.0944-.6295 3.8188 3.8188 0 0 1-1.6852-2.5075 3.7856 3.7856 0 0 1-.058-.693Z" />
          </svg>
        </a>
      )}
    </div>
  )
}
