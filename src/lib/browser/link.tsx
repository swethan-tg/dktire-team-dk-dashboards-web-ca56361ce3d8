import { forwardRef } from 'react';
import { Link as RouterLink, type LinkProps as RouterLinkProps } from 'react-router-dom';

type LinkProps = Omit<RouterLinkProps, 'to'> & {
  href: string;
};

const Link = forwardRef<HTMLAnchorElement, LinkProps>(({ href, ...props }, ref) => {
  const isExternal = /^https?:\/\//.test(href);

  if (isExternal) {
    return <a ref={ref} href={href} {...props} />;
  }

  return <RouterLink ref={ref} to={href} {...props} />;
});

Link.displayName = 'LocalLink';

export default Link;
