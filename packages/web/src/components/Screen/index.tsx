import { Global, css } from "@emotion/react";
import { type CSSProperties, memo } from "react";
import { isDesktop, isMobileOnly } from "react-device-detect";
import { ErrorBoundary } from "react-error-boundary";
import { Outlet } from "react-router-dom";

import Fallback from "../Fallback";
import DetectedOverall from "../NodeDetected/DetectedFloating";
import PreviewWatermark from "../PreviewWatermark";
import StatusBar from "../StatusBar";
import useDeviceConfig from "../useDeviceConfig";

const Screen = () => {
	const { screenSize } = useDeviceConfig();

	const style: CSSProperties = isMobileOnly
		? { width: "100vw", height: "100vh" }
		: {
				width: screenSize.width,
				height: screenSize.height,
			};

	return (
		<div style={style} className="relative flex flex-col overflow-hidden" id="screen">
			<Global
				styles={css`
          &::-webkit-scrollbar {
            display: none;
          }
        `}
			/>
			<DetectedOverall />
			{isDesktop && <StatusBar />}
			<ErrorBoundary FallbackComponent={Fallback}>
				<Outlet />
			</ErrorBoundary>
			{/* 置于末尾，避免影响状态栏对 nextSibling 的背景色探测 */}
			<PreviewWatermark />
		</div>
	);
};

export default memo(Screen);
