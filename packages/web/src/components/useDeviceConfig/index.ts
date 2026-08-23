import { MOBILE_LIST, SCREEN_SIZE, deviceAtom } from "@/stateV2/device";
import { useSize } from "ahooks";
import { useAtomValue } from "jotai";

export default function useDeviceConfig() {
	const device = useAtomValue(deviceAtom);
	const size = useSize(() => document.querySelector("#center"));
	let screenSize: {
		width: number;
		height: number;
	};
	if (device === MOBILE_LIST.AUTO) {
		const horizontalGutter = 30;
		// TopPopover 已隐藏，不再预留顶部浮层空间
		const verticalGutter = 16;
		screenSize = {
			width: Math.max(0, (size?.width ?? 0) - horizontalGutter),
			height: Math.max(0, (size?.height ?? 0) - verticalGutter),
		};
	} else {
		screenSize = SCREEN_SIZE[device];
	}

	return {
		screenSize,
		device,
	};
}
