import { TextStyle } from 'react-native';

import { FONTS } from './fonts';

export const TYPOGRAPHY: Record<
  'title' | 'heading' | 'body' | 'bodyStrong' | 'caption' | 'overline',
  TextStyle
> = {
  title: { fontFamily: FONTS.bold, fontSize: 28, lineHeight: 34 },
  heading: { fontFamily: FONTS.semiBold, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: FONTS.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: FONTS.medium, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: FONTS.regular, fontSize: 13, lineHeight: 18 },
  overline: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
};
