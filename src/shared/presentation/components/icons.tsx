import type { SVGProps } from "react";

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  google: (props: SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <title>Google</title>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.58 2.6-5.82 2.6-4.92 0-8.92-4.02-8.92-8.92s4-8.92 8.92-8.92c2.82 0 4.65 1.12 5.72 2.15l2.6-2.6C19.12 1.95 16.12 0 12.48 0 5.88 0 0 5.88 0 12s5.88 12 12.48 12c7.2 0 12.12-4.8 12.12-12.36 0-.8-.08-1.48-.2-2.16H12.48z" />
    </svg>
  ),
};
