import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

const SF_TO_IONICON: Record<string, IoniconName> = {
  'cart.fill': 'cart',
  'fork.knife': 'restaurant',
  'house.fill': 'home',
  'bag.fill': 'bag',
  'tv.fill': 'tv',
  'car.fill': 'car',
  'bolt.fill': 'flash',
  repeat: 'repeat',
  'heart.fill': 'heart',
  'book.fill': 'book',
  ellipsis: 'ellipsis-horizontal',
  'tag.fill': 'pricetag',
  'briefcase.fill': 'briefcase',
  'banknote.fill': 'cash',
  'creditcard.fill': 'card',
  'gift.fill': 'gift',
  'tram.fill': 'train',
  airplane: 'airplane',
  'cross.case.fill': 'medkit',
  'graduationcap.fill': 'school',
  'gamecontroller.fill': 'game-controller',
  'music.note': 'musical-notes',
  'pawprint.fill': 'paw',
  'leaf.fill': 'leaf',
  'hammer.fill': 'hammer',
  'exclamationmark.triangle': 'warning',
  bell: 'notifications',
  'checkmark.circle': 'checkmark-circle',
  'arrow.up.right': 'trending-up',
  'arrow.down.right': 'trending-down',
  'chart.line.uptrend.xyaxis': 'analytics',
  'party.popper': 'sparkles',
  'calendar.badge.plus': 'calendar',
  briefcase: 'briefcase',
  'equal.circle': 'remove-circle',
  'calendar.badge.exclamationmark': 'alert-circle',
  'waveform.path.ecg': 'pulse',
};

export function mapIconName(sfSymbol: string): IoniconName {
  return SF_TO_IONICON[sfSymbol] ?? 'pricetag';
}
