import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface BookingConfirmationProps {
  firstName: string;
  vanName: string;
  startDate: string;
  endDate: string;
  totalEuros: string;
  upfrontEuros: string;
  balanceEuros: string;
  handoverLocation: string;
  handoverTime: string;
  phone: string;
}

export default function BookingConfirmation(props: BookingConfirmationProps) {
  const {
    firstName,
    vanName,
    startDate,
    endDate,
    totalEuros,
    upfrontEuros,
    balanceEuros,
    handoverLocation,
    handoverTime,
    phone,
  } = props;

  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre réservation de {vanName} est confirmée</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.h1}>Réservation confirmée</Heading>
          <Text style={styles.p}>Bonjour {firstName},</Text>
          <Text style={styles.p}>
            Votre réservation est confirmée. Voici le récapitulatif.
          </Text>

          <Section style={styles.card}>
            <Text style={styles.label}>Van</Text>
            <Text style={styles.value}>{vanName}</Text>
            <Text style={styles.label}>Dates</Text>
            <Text style={styles.value}>
              Du {startDate} au {endDate}
            </Text>
            <Hr style={styles.hr} />
            <Text style={styles.label}>Montant total</Text>
            <Text style={styles.value}>{totalEuros}</Text>
            <Text style={styles.label}>Acompte versé</Text>
            <Text style={styles.value}>{upfrontEuros}</Text>
            <Text style={styles.label}>Solde à régler à la remise</Text>
            <Text style={styles.value}>{balanceEuros}</Text>
            <Text style={styles.label}>Caution (empreinte bancaire)</Text>
            <Text style={styles.value}>1 500 €</Text>
            <Hr style={styles.hr} />
            <Text style={styles.label}>Lieu de remise</Text>
            <Text style={styles.value}>
              {handoverLocation} à {handoverTime}
            </Text>
          </Section>

          <Text style={styles.p}>
            Quelques jours avant le départ, vous recevrez une fiche météo, quelques spots
            que nous aimons, et la check-list de restitution.
          </Text>

          <Text style={styles.p}>
            Pour une question, répondez à ce mail ou appelez-moi au {phone}.
          </Text>

          <Text style={styles.signature}>Romain — RB-CapSO</Text>
          <Text style={styles.footer}>
            RB-CapSO — Atelier de menuiserie et location de vans — Capbreton, Landes.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#EFE8DC",
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
    color: "#1E2A24",
  },
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "40px 24px",
  },
  h1: {
    fontFamily: "Georgia, serif",
    fontSize: "28px",
    fontWeight: 500,
    marginBottom: "16px",
  },
  p: {
    fontSize: "16px",
    lineHeight: "1.6",
    margin: "12px 0",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "24px",
    margin: "24px 0",
    borderLeft: "3px solid #8AA18A",
  },
  label: {
    fontSize: "12px",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    color: "rgba(30,42,36,0.6)",
    margin: "12px 0 4px",
  },
  value: {
    fontSize: "16px",
    margin: "0",
    fontWeight: 500,
  },
  hr: {
    borderColor: "rgba(30,42,36,0.1)",
    margin: "16px 0",
  },
  signature: {
    fontFamily: "Georgia, serif",
    fontSize: "18px",
    margin: "32px 0 8px",
  },
  footer: {
    fontSize: "12px",
    color: "rgba(30,42,36,0.5)",
    marginTop: "24px",
    borderTop: "1px solid rgba(30,42,36,0.1)",
    paddingTop: "16px",
  },
};
