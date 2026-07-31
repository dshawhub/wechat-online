import type { IStateProfile, TStateAllProfiles } from "@/stateV2/profile";
import CATERPILLAR_AVATAR from "@/assets/caterpillar-avatar.jpg";
import KIRBY_AVATAR from "@/assets/kirby-avatar.jpg";
import MEI_AVATAR from "@/assets/mei-avatar.jpg";
import { PNQQK6, PNQZ5X } from "@/assets/cdn";

export const MYSELF_ID = "0";

export const INIT_MY_PROFILE: IStateProfile = {
	id: MYSELF_ID,
	nickname: "毛毛虫",
	avatarInfo: CATERPILLAR_AVATAR,
	wechat: "*",
	gender: "male",
	momentsBackgroundInfo: PNQQK6,
	momentsPrivacy: "all",
	thumbnailInfo: [],
	momentsBackgroundLike: false,
	privacy: "all",
	area: "中国大陆",
	signature: "不学习是🐶再熬夜是🐷",
};

/**
 * 好友列表
 */
export const INIT_FRIENDS: TStateAllProfiles = [
	{
		id: "1",
		nickname: "唐吉诃德",
		avatarInfo: MEI_AVATAR,
		wechat: "*",
		gender: "female",
		privacy: "all",
		thumbnailInfo: [],
		momentsBackgroundInfo: PNQZ5X,
		momentsBackgroundLike: false,
		momentsPrivacy: "all",
		signature: "Cr",
		area: "韩国 仁川 仁川市",
		isStarred: true,
	},
	{
		id: "2",
		nickname: "星之笨比",
		avatarInfo: KIRBY_AVATAR,
		wechat: "*",
		privacy: "all",
		thumbnailInfo: [],
		momentsBackgroundInfo: PNQZ5X,
		momentsBackgroundLike: false,
		momentsPrivacy: "all",
	},
];
