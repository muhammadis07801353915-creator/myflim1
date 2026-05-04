import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/portal-control-center/', // کێبڕکێ و گەڕان لە بەشی ئەدمین قەدەغە بکە
    },
    sitemap: 'https://myflim.com/sitemap.xml',
  };
}
