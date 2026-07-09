import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Link,
} from "@react-pdf/renderer";

// Register Inter font
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff", fontWeight: 700 },
  ],
});

// Elite Navy Design System Colors
const colors = {
  navy: "#0B1F3B",
  navyLight: "#1A3A5C",
  gold: "#C6A15B",
  goldLight: "#D4B878",
  glacier: "#A9BCD0",
  cloud: "#F5F7FB",
  white: "#FFFFFF",
  muted: "#6B7C93",
  success: "#2ECC71",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    fontFamily: "Inter",
    fontSize: 10,
    color: colors.navy,
  },
  // Cover Page
  coverPage: {
    flex: 1,
    backgroundColor: colors.navy,
    padding: 40,
    justifyContent: "space-between",
  },
  coverHeader: {
    alignItems: "center",
    marginTop: 60,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 700,
    color: colors.white,
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 10,
    color: colors.glacier,
    marginTop: 8,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  coverMain: {
    alignItems: "center",
    marginTop: 80,
  },
  coverTitle: {
    fontSize: 14,
    color: colors.gold,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  coverName: {
    fontSize: 32,
    fontWeight: 700,
    color: colors.white,
    textAlign: "center",
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 12,
    color: colors.glacier,
    textAlign: "center",
  },
  coverBadge: {
    marginTop: 40,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.gold,
    borderRadius: 6,
  },
  coverBadgeText: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.navy,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  coverFooter: {
    alignItems: "center",
    paddingBottom: 40,
  },
  coverDate: {
    fontSize: 10,
    color: colors.glacier,
  },
  // Content Pages
  contentPage: {
    padding: 40,
    paddingTop: 50,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.glacier,
  },
  pageHeaderLogo: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.navy,
    letterSpacing: 1,
  },
  pageNumber: {
    fontSize: 9,
    color: colors.muted,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.navy,
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  // Summary Section
  summaryCard: {
    backgroundColor: colors.cloud,
    borderRadius: 8,
    padding: 20,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.muted,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.navy,
  },
  // Points Table
  pointsTable: {
    marginTop: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.navy,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.white,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cloud,
  },
  tableRowAlt: {
    backgroundColor: colors.cloud,
  },
  tableCell: {
    fontSize: 10,
    color: colors.navy,
  },
  tableCellPoints: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.gold,
  },
  categoryCol: { width: "40%" },
  detailCol: { width: "40%" },
  pointsCol: { width: "20%", textAlign: "right" },
  // Total Row
  totalRow: {
    flexDirection: "row",
    backgroundColor: colors.navy,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.white,
    width: "80%",
  },
  totalPoints: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.gold,
    width: "20%",
    textAlign: "right",
  },
  // Consultation Notes
  notesSection: {
    marginTop: 24,
  },
  notesCard: {
    backgroundColor: colors.cloud,
    borderRadius: 8,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
  },
  notesLabel: {
    fontSize: 9,
    color: colors.gold,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
    fontWeight: 600,
  },
  notesText: {
    fontSize: 11,
    color: colors.navy,
    lineHeight: 1.7,
  },
  // Next Steps
  priorityList: {
    marginTop: 16,
  },
  priorityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingLeft: 8,
  },
  priorityNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gold,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  priorityNumberText: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.navy,
  },
  priorityContent: {
    flex: 1,
  },
  priorityTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.navy,
    marginBottom: 4,
  },
  priorityDescription: {
    fontSize: 10,
    color: colors.muted,
    lineHeight: 1.5,
  },
  // Strategic Summary
  strategicText: {
    fontSize: 11,
    color: colors.navy,
    lineHeight: 1.7,
    marginBottom: 16,
  },
  highlightBox: {
    backgroundColor: colors.gold,
    borderRadius: 6,
    padding: 16,
    marginVertical: 16,
  },
  highlightText: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.navy,
    textAlign: "center",
  },
  // CTA Page
  ctaPage: {
    flex: 1,
    backgroundColor: colors.navy,
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaContent: {
    alignItems: "center",
    maxWidth: 400,
  },
  ctaTitle: {
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  ctaHeadline: {
    fontSize: 28,
    fontWeight: 700,
    color: colors.white,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 1.3,
  },
  ctaSubtext: {
    fontSize: 12,
    color: colors.glacier,
    textAlign: "center",
    lineHeight: 1.6,
    marginBottom: 40,
  },
  ctaButton: {
    backgroundColor: colors.gold,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.navy,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  ctaLink: {
    fontSize: 10,
    color: colors.glacier,
    textDecoration: "none",
  },
  // Footer
  pageFooter: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.cloud,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: colors.muted,
  },
  disclaimer: {
    marginTop: 30,
    padding: 16,
    backgroundColor: colors.cloud,
    borderRadius: 6,
  },
  disclaimerText: {
    fontSize: 8,
    color: colors.muted,
    lineHeight: 1.5,
  },
});

interface PointsBreakdown {
  category: string;
  detail: string;
  points: number;
}

interface Priority {
  title: string;
  description: string;
}

interface FinalizedStrategyPDFProps {
  fullName: string;
  personaType: string;
  pointsScore: number;
  pointsBreakdown: PointsBreakdown[];
  priorities: Priority[];
  strategicSummary: string;
  consultationNotes: string;
  generatedDate: string;
  dashboardUrl: string;
}

export const FinalizedStrategyPDF = ({
  fullName,
  personaType,
  pointsScore,
  pointsBreakdown,
  priorities,
  strategicSummary,
  consultationNotes,
  generatedDate,
  dashboardUrl,
}: FinalizedStrategyPDFProps) => {
  const getPersonaLabel = (type: string) => {
    switch (type) {
      case "student":
        return "Student to PR Pathway";
      case "skilled":
        return "Skilled Migration Pathway";
      case "onshore-skilled":
        return "Onshore Professional Pathway";
      case "partner":
        return "Partner Visa Pathway";
      case "employer":
        return "Employer Sponsored Pathway";
      default:
        return "Migration Strategy";
    }
  };

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverHeader}>
          <Text style={styles.logoText}>MigrationPath</Text>
          <Text style={styles.logoSubtext}>Australian Migration Specialists</Text>
        </View>

        <View style={styles.coverMain}>
          <Text style={styles.coverTitle}>Post-Consultation Strategy Report</Text>
          <Text style={styles.coverName}>{fullName}</Text>
          <Text style={styles.coverSubtitle}>{getPersonaLabel(personaType)}</Text>
          <View style={styles.coverBadge}>
            <Text style={styles.coverBadgeText}>Strategy Delivered</Text>
          </View>
        </View>

        <View style={styles.coverFooter}>
          <Text style={styles.coverDate}>Prepared on {generatedDate}</Text>
        </View>
      </Page>

      {/* Points Breakdown Page */}
      <Page size="A4" style={[styles.page, styles.contentPage]}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageHeaderLogo}>MigrationPath</Text>
          <Text style={styles.pageNumber}>Page 1</Text>
        </View>

        <Text style={styles.sectionSubtitle}>Your Assessment</Text>
        <Text style={styles.sectionTitle}>Points Breakdown</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Current Total Points</Text>
            <Text style={styles.summaryValue}>{pointsScore} / 100</Text>
          </View>
          <View style={[styles.summaryRow, { marginBottom: 0 }]}>
            <Text style={styles.summaryLabel}>Minimum Threshold</Text>
            <Text style={styles.summaryValue}>65 points</Text>
          </View>
        </View>

        <View style={styles.pointsTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.categoryCol]}>Category</Text>
            <Text style={[styles.tableHeaderCell, styles.detailCol]}>Your Status</Text>
            <Text style={[styles.tableHeaderCell, styles.pointsCol]}>Points</Text>
          </View>

          {pointsBreakdown.map((row, index) => (
            <View
              key={index}
              style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
            >
              <Text style={[styles.tableCell, styles.categoryCol]}>{row.category}</Text>
              <Text style={[styles.tableCell, styles.detailCol]}>{row.detail}</Text>
              <Text style={[styles.tableCellPoints, styles.pointsCol]}>+{row.points}</Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Points</Text>
            <Text style={styles.totalPoints}>{pointsScore}</Text>
          </View>
        </View>

        <View style={styles.pageFooter}>
          <Text style={styles.footerText}>MigrationPath.com.au | MARA Registered</Text>
          <Text style={styles.footerText}>Confidential</Text>
        </View>
      </Page>

      {/* Strategy & Consultation Notes Page */}
      <Page size="A4" style={[styles.page, styles.contentPage]}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageHeaderLogo}>MigrationPath</Text>
          <Text style={styles.pageNumber}>Page 2</Text>
        </View>

        <Text style={styles.sectionSubtitle}>Strategic Analysis</Text>
        <Text style={styles.sectionTitle}>Your Migration Strategy</Text>

        <Text style={styles.strategicText}>{strategicSummary}</Text>

        <View style={styles.highlightBox}>
          <Text style={styles.highlightText}>
            {pointsScore >= 85
              ? "High Probability: You exceed typical invitation thresholds"
              : pointsScore >= 65
                ? "On Track: You meet the minimum points requirement"
                : "Action Required: Focus on the priorities below to reach 65+ points"}
          </Text>
        </View>

        {/* Consultation Notes from Admin */}
        {consultationNotes && (
          <View style={styles.notesSection}>
            <View style={styles.notesCard}>
              <Text style={styles.notesLabel}>Agent Consultation Notes</Text>
              <Text style={styles.notesText}>{consultationNotes}</Text>
            </View>
          </View>
        )}

        <View style={styles.pageFooter}>
          <Text style={styles.footerText}>MigrationPath.com.au | MARA Registered</Text>
          <Text style={styles.footerText}>Confidential</Text>
        </View>
      </Page>

      {/* Action Plan Page */}
      <Page size="A4" style={[styles.page, styles.contentPage]}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageHeaderLogo}>MigrationPath</Text>
          <Text style={styles.pageNumber}>Page 3</Text>
        </View>

        <Text style={styles.sectionSubtitle}>Action Plan</Text>
        <Text style={styles.sectionTitle}>Your Top Priorities</Text>

        <View style={styles.priorityList}>
          {priorities.slice(0, 5).map((priority, index) => (
            <View key={index} style={styles.priorityItem}>
              <View style={styles.priorityNumber}>
                <Text style={styles.priorityNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.priorityContent}>
                <Text style={styles.priorityTitle}>{priority.title}</Text>
                <Text style={styles.priorityDescription}>{priority.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            This document is for informational purposes only and does not constitute legal advice.
            Migration regulations are subject to change. For personalized advice, please book a
            strategy session with a MARA-registered migration agent. MigrationPath operates under
            the guidance of the Office of the Migration Agents Registration Authority (OMARA).
          </Text>
        </View>

        <View style={styles.pageFooter}>
          <Text style={styles.footerText}>MigrationPath.com.au | MARA Registered</Text>
          <Text style={styles.footerText}>Confidential</Text>
        </View>
      </Page>

      {/* CTA Page - Begin Your Journey */}
      <Page size="A4" style={styles.ctaPage}>
        <View style={styles.ctaContent}>
          <Text style={styles.ctaTitle}>Next Step</Text>
          <Text style={styles.ctaHeadline}>Begin Your Lodgement Journey</Text>
          <Text style={styles.ctaSubtext}>
            Your personalized document checklist is ready. Upload your supporting documents
            to complete your migration file and prepare for lodgement.
          </Text>
          <Link src={dashboardUrl} style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Go to Your Dashboard</Text>
          </Link>
          <Text style={styles.ctaLink}>{dashboardUrl}</Text>
        </View>
      </Page>
    </Document>
  );
};
