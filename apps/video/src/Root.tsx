import { Composition } from "remotion";
import { QuoteCard, quoteCardSchema } from "./compositions/QuoteCard";
import {
  LaunchAnnouncement,
  launchAnnouncementSchema,
} from "./compositions/LaunchAnnouncement";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="QuoteCard"
        component={QuoteCard as any}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        schema={quoteCardSchema}
        defaultProps={{
          author: "Marion H.",
          city: "Bordeaux",
          stars: 5,
          quote:
            "Quatre jours à Zarautz avec Marceau. Pas un défaut. On revient l'été prochain.",
          vanId: "marceau" as const,
        }}
      />

      <Composition
        id="LaunchAnnouncement"
        component={LaunchAnnouncement}
        durationInFrames={510}
        fps={30}
        width={1080}
        height={1920}
        schema={launchAnnouncementSchema}
        defaultProps={{ siteUrl: "rb-capso.fr" }}
      />
    </>
  );
};
