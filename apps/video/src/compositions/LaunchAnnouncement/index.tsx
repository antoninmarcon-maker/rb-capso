import { AbsoluteFill, Sequence } from "remotion";
import { z } from "zod";
import { loadFont } from "@remotion/google-fonts/Geist";
import { LogoCard } from "./cards/LogoCard";
import { PhotoCard } from "./cards/PhotoCard";

loadFont("normal", { weights: ["400", "500", "600", "700"] });

export const launchAnnouncementSchema = z.object({
  siteUrl: z.string().default("rb-capso.fr"),
});

export type LaunchAnnouncementProps = z.infer<typeof launchAnnouncementSchema>;

export function LaunchAnnouncement({ siteUrl }: LaunchAnnouncementProps) {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={45}>
        <LogoCard variant="intro" />
      </Sequence>

      <Sequence from={45} durationInFrames={75}>
        <PhotoCard
          imageSrc="photos/atelier-menuiserie.jpg"
          title="Atelier RB-CapSO"
          subtitle="Capbreton, Landes"
          labelPosition="bottom"
          durationInFrames={75}
        />
      </Sequence>

      <Sequence from={120} durationInFrames={75}>
        <PhotoCard
          imageSrc="photos/van-penelope.jpg"
          title="Pénélope"
          subtitle="Ford Transit Custom"
          labelPosition="bottom"
          durationInFrames={75}
        />
      </Sequence>

      <Sequence from={195} durationInFrames={75}>
        <PhotoCard
          imageSrc="photos/van-peggy.jpg"
          title="Peggy"
          subtitle="Fiat Ducato L2H2"
          labelPosition="top"
          durationInFrames={75}
        />
      </Sequence>

      <Sequence from={270} durationInFrames={60}>
        <PhotoCard
          imageSrc="photos/mains-atelier.jpg"
          title="Aménagement sur-mesure"
          labelPosition="bottom"
          durationInFrames={60}
          kenBurns={{ from: 1.0, to: 1.03 }}
        />
      </Sequence>

      <Sequence from={330} durationInFrames={90}>
        <PhotoCard
          imageSrc="photos/hero-poster.jpg"
          title="Fait main,"
          subtitle="pour prendre le large."
          labelPosition="bottom"
          durationInFrames={90}
          textStartFrame={15}
          subtitleDelayFrames={30}
          kenBurns={{ from: 1.0, to: 1.0 }}
        />
      </Sequence>

      <Sequence from={420} durationInFrames={90}>
        <LogoCard variant="outro" siteUrl={siteUrl} />
      </Sequence>
    </AbsoluteFill>
  );
}
