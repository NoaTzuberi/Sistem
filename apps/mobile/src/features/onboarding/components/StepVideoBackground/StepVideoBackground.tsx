import './StepVideoBackground.css';

interface StepVideoBackgroundProps {
  videoSrc: string | undefined;
}

export function StepVideoBackground({ videoSrc }: StepVideoBackgroundProps) {
  if (!videoSrc) {
    return null;
  }

  return (
    <div className="step-video-background">
      <video
        key={videoSrc}
        className="step-video-background-media"
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
      />
    </div>
  );
}
