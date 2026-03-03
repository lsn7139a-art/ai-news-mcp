import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const RemotionIntro = () => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	
	// 动画参数
	const opacity = spring({
		frame,
		fps,
		config: {damping: 10},
	});
	
	const scale = spring({
		frame,
		fps,
		config: {mass: 1, damping: 10, stiffness: 100},
		from: 0.5,
		to: 1,
	});
	
	const rotate = interpolate(frame, [0, durationInFrames], [0, 360]);
	
	return (
		<div
			style={{
				flex: 1,
				backgroundColor: '#0a0e17',
				justifyContent: 'center',
				alignItems: 'center',
				display: 'flex',
			}}
		>
			<div
				style={{
					color: '#00f3ff',
					fontSize: '120px',
					fontWeight: 'bold',
					fontFamily: 'Arial, sans-serif',
					textShadow: '0 0 30px #00f3ff, 0 0 60px #00f3ff',
					opacity,
					transform: `scale(${scale}) rotate(${rotate}deg)`,
				}}
			>
				REMOTION
			</div>
		</div>
	);
};