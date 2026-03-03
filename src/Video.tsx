import {Composition} from 'remotion';
import {RemotionIntro} from './RemotionIntro';

export const Video = () => {
	return (
		<>
			<Composition
				id="RemotionIntro"
				component={RemotionIntro}
				durationInFrames={150}
				fps={30}
				width={1920}
				height={1080}
			/>
		</>
	);
};
