import { App as AntdApp, ConfigProvider } from "antd";
import { useTranslation } from "react-i18next";

import LeftPanel from "./components/LeftPanel";
import RightPanel from "./components/RightPanel";
import Screen from "./components/Screen";
// import TopPopover from "./components/TopPopover";
import Tour from "./components/Tour";
import { ANTD_LANG_MAP } from "./i18n";

const App = () => {
	const { i18n } = useTranslation();

	return (
		<ConfigProvider locale={ANTD_LANG_MAP[i18n.language as keyof typeof ANTD_LANG_MAP]}>
			<div className="grid h-screen grid-cols-3 overflow-hidden max-lg:grid-cols-1">
				<AntdApp className="max-lg:hidden">
					<LeftPanel />
				</AntdApp>
				<div
					className="flex min-h-0 items-start justify-center overflow-auto border-orange-400 border-r border-l border-dashed max-lg:border-none"
					id="center"
				>
					<div className="border">
						{/* 站点嵌入预览页隐藏「切换模式」浮层，左侧栏仍可切换编辑/预览 */}
						{/* <TopPopover>
							<Screen />
						</TopPopover> */}
						<Screen />
					</div>
				</div>
				<RightPanel />
			</div>
			<Tour />
		</ConfigProvider>
	);
};

export default App;
