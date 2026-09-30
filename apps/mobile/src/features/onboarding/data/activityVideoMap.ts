import gymVideo from '../../../assets/onBoardingvid/gym.mp4';
import calisthenicsVideo from '../../../assets/onBoardingvid/10477144-uhd_4096_2160_25fps.mp4';
import functionalVideo from '../../../assets/onBoardingvid/Functional.mp4';
import crossfitVideo from '../../../assets/onBoardingvid/crossfit.mp4';
import runningVideo from '../../../assets/onBoardingvid/running.mp4';
import cyclingVideo from '../../../assets/onBoardingvid/Cycling.mp4';
import swimmingVideo from '../../../assets/onBoardingvid/swimming.mp4';
import rowingVideo from '../../../assets/onBoardingvid/Rowing.mp4';
import hikingVideo from '../../../assets/onBoardingvid/hiking.mp4';
import jumpRopeVideo from '../../../assets/onBoardingvid/jump rope.mp4';
import yogaVideo from '../../../assets/onBoardingvid/Yoga.mp4';
import pilatesVideo from '../../../assets/onBoardingvid/Pilates.mp4';
import mobilityVideo from '../../../assets/onBoardingvid/Mobility.mp4';
import danceVideo from '../../../assets/onBoardingvid/Dance.mp4';
import boxingVideo from '../../../assets/onBoardingvid/Boxing.mp4';
import martialArtsVideo from '../../../assets/onBoardingvid/Martial Arts.mp4';
import brazilianJiuJitsuVideo from '../../../assets/onBoardingvid/Jiu-Jitsu.mp4';
import muayThaiVideo from '../../../assets/onBoardingvid/5752167-uhd_3840_2160_25fps.mp4';
import surfingVideo from '../../../assets/onBoardingvid/Surfing.mp4';
import skateboardingVideo from '../../../assets/onBoardingvid/skateboarding.mp4';
import climbingVideo from '../../../assets/onBoardingvid/Climbing.mp4';
import skiingVideo from '../../../assets/onBoardingvid/Skiing.mp4';
import snowboardingVideo from '../../../assets/onBoardingvid/Snowboarding.mp4';
import footballSoccerVideo from '../../../assets/onBoardingvid/football.mp4';
import basketballVideo from '../../../assets/onBoardingvid/basketball.mp4';
import tennisVideo from '../../../assets/onBoardingvid/Tennis.mp4';
import volleyballVideo from '../../../assets/onBoardingvid/volyball.mp4';
import tableTennisVideo from '../../../assets/onBoardingvid/Table Tennis.mp4';
import badmintonVideo from '../../../assets/onBoardingvid/Badminton.mp4';
import rugbyVideo from '../../../assets/onBoardingvid/Rugby.mp4';

/**
 * Maps an activity id (see activities.ts) to a background video source.
 *
 * Footage lives in apps/mobile/src/assets/onBoardingvid/, which is gitignored
 * (see .gitignore) due to its size — local development only until an
 * LFS/CDN decision is made. Every activity has a clip except
 * 'other_activity', which intentionally has none.
 */
export const ACTIVITY_VIDEO_MAP: Partial<Record<string, string>> = {
  gym_strength_training: gymVideo,
  calisthenics: calisthenicsVideo,
  functional_training: functionalVideo,
  crossfit: crossfitVideo,
  running: runningVideo,
  cycling: cyclingVideo,
  swimming: swimmingVideo,
  rowing: rowingVideo,
  hiking: hikingVideo,
  jump_rope: jumpRopeVideo,
  yoga: yogaVideo,
  pilates: pilatesVideo,
  mobility: mobilityVideo,
  dance: danceVideo,
  boxing: boxingVideo,
  martial_arts: martialArtsVideo,
  brazilian_jiu_jitsu: brazilianJiuJitsuVideo,
  muay_thai: muayThaiVideo,
  surfing: surfingVideo,
  skateboarding: skateboardingVideo,
  climbing: climbingVideo,
  skiing: skiingVideo,
  snowboarding: snowboardingVideo,
  football_soccer: footballSoccerVideo,
  basketball: basketballVideo,
  tennis: tennisVideo,
  volleyball: volleyballVideo,
  table_tennis: tableTennisVideo,
  badminton: badmintonVideo,
  rugby: rugbyVideo,
};
