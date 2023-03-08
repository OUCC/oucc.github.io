import type { PictureComponentLocalImageProps } from '@astrojs/image/components'
import welcomeImage from '@/features/activity/assets/welcome.webp'
import exhibition1Image from '@/features/activity/assets/exhibition1.webp'
import exhibition2Image from '@/features/activity/assets/exhibition2.webp'
import summerTripImage from '@/features/activity/assets/summer_trip.webp'
import kc3Image from '@/features/activity/assets/kc3.webp'
import machikanesaiImage from '@/features/activity/assets/machikanesai.webp'
import adventCalendarImage from '@/features/activity/assets/advent_calendar.webp'
import codeImage from '@/features/activity/assets/code.webp'
import oikonImage from '@/features/activity/assets/oikon.webp'
import springDevImage from '@/features/activity/assets/spring_dev.webp'

export interface Event {
  title: string
  image: PictureComponentLocalImageProps['src']
  description: string
}

export const events: Event[] = [
  {
    title: '4月 講習会',
    image: welcomeImage,
    description:
      'プログラミングの基礎、機械学習、3Dモデリングなど様々なテーマで、数カ月間にわたり講習会が開催されます。新歓イベントの一環として開催しており、どなたでも参加できます。※画像は2022年度のものです',
  },
  {
    title: '5月 いちょう祭',
    image: exhibition1Image,
    description:
      '大阪大学の文化祭であるいちょう祭に出展し、OUCCで制作したゲーム、対話AI、VR体験などの展示を行います。',
  },
  {
    title: '6月 ハッカソン',
    image: exhibition2Image,
    description:
      'いくつかのチームに分かれ、テーマに沿ったソフトウェアを数週間で共同開発します。最終日には全チームで成果発表を行います。',
  },
  {
    title: '8月 開発合宿',
    image: summerTripImage,
    description:
      'メンバー全員でアイデアを出し合い、協力してプログラミングに取り組みます。集中して取り組める環境で、より深い技術力の向上やチームワークの強化を目指しています。',
  },
  {
    title: '9月 KC3',
    image: kc3Image,
    description:
      'KC3（関西情報系学生団体交流会）の交流会・勉強会に参加します。他大学の学生と親交を深める貴重な機会です。',
  },
  {
    title: '11月 まちかね祭',
    image: machikanesaiImage,
    description:
      '大阪大学の大学祭であるまちかね祭に出展し、食品を販売する模擬店を開きます。',
  },
  {
    title: '12月 Advent Calendar',
    image: adventCalendarImage,
    description:
      '12月1日から25日までブログ記事を投稿する企画を行います。部員が各々好きなテーマで記事を執筆し、毎日投稿を目指します。',
  },
  {
    title: '2月 KC3Hack',
    image: codeImage,
    description:
      'KC3（関西情報系学生団体交流会）のハッカソンに参加します。参加者を混成したチームが編成され、1週間という短期間でひとつのプロダクトを完成させます。協賛企業からフィードバックや交流の機会をいただくこともできます。',
  },
  {
    title: '2月 追いコン',
    image: oikonImage,
    description:
      '3月に大学を卒業する4回生を見送る追いコンを開催します。現役メンバーにとっては対面で集まって親交を深める機会でもあります。',
  },
  {
    title: '3月 春休み共同開発',
    image: springDevImage,
    description:
      '複数のチームに分かれて共同開発を行います。各自でテーマを投稿し、興味を持った人で集まってチームを構成します。最終日には全チームで成果発表を行います。',
  },
]
