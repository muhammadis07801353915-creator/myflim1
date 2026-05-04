import { Metadata } from 'next';
import LiveTV from '@/src/components/LiveTV';

export const metadata: Metadata = {
  title: 'پەخشی ڕاستەوخۆ | Live TV - MyFlim',
  description: 'بینەری کەناڵە ئاسمانی و ناوخۆییەکان بن بە شێوەی ڕاستەوخۆ و بە کوالێتی بەرز.',
  openGraph: {
    title: 'پەخشی ڕاستەوخۆ - MyFlim',
    description: 'کۆمەڵێک کەناڵی تەلەفزیۆنی جۆراوجۆر بە شێوەی ڕاستەوخۆ ببێنە',
  }
};

export default function LiveTVPage() {
  return <LiveTV />;
}
