import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';

export const MyComponent: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	
	const opacity = Math.min(1, frame / 30);
	const scale = 1 + Math.sin(frame / 30) * 0.2;
	
	return (
		<div
			style={{
				flex: 1,
				backgroundColor: '#4a90e2',
				justifyContent: 'center',
				alignItems: 'center',
				display: 'flex',
				fontSize: '80px',
				color: 'white',
				opacity,
				transform: `scale(${scale})`,
			}}
		>
			<div>
				<div>Hello Remotion!</div>
				<div style={{fontSize: '40px', marginTop: '20px'}}>
					Frame: {frame} ({(frame / fps).toFixed(2)}s)
				</div>
			</div>
		</div>
	);
};