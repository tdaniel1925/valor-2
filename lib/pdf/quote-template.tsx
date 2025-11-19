/**
 * PDF template for life insurance quotes
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { QuotePDFData } from './types';

// Register fonts (using default fonts for now)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
  ],
});

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#333333',
  },
  header: {
    marginBottom: 30,
    borderBottom: '3 solid #2563eb',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  greeting: {
    marginBottom: 15,
    lineHeight: 1.5,
  },
  quoteCard: {
    border: '1 solid #e5e7eb',
    borderRadius: 4,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#f9fafb',
  },
  bestValueCard: {
    border: '2 solid #10b981',
    backgroundColor: '#ecfdf5',
  },
  bestValueBadge: {
    backgroundColor: '#10b981',
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    padding: '4 8',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  carrierName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  productName: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 10,
  },
  premiumLabel: {
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  premium: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 10,
  },
  detailsSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1 solid #e5e7eb',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    fontSize: 10,
  },
  detailLabel: {
    color: '#6b7280',
  },
  detailValue: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  featuresSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1 solid #e5e7eb',
  },
  featuresTitle: {
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  feature: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    fontSize: 9,
    padding: '3 6',
    borderRadius: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  expirationNotice: {
    backgroundColor: '#fef3c7',
    borderLeft: '3 solid #f59e0b',
    padding: 12,
    marginVertical: 15,
    borderRadius: 2,
  },
  expirationText: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  contactSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    textAlign: 'center',
  },
  contactTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  contactDetail: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: '2 solid #e5e7eb',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 8,
  },
  disclaimer: {
    fontSize: 8,
    color: '#9ca3af',
    lineHeight: 1.4,
    marginTop: 8,
  },
});

// Format currency helper
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Format date helper
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

interface QuotePDFProps {
  data: QuotePDFData;
}

export const QuotePDF: React.FC<QuotePDFProps> = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Life Insurance Quotes</Text>
          <Text style={styles.subtitle}>
            Prepared for {data.clientName}
          </Text>
        </View>

        {/* Greeting */}
        <View style={styles.section}>
          <View style={styles.greeting}>
            <Text>Dear {data.clientName},</Text>
            <Text style={{ marginTop: 8 }}>
              Thank you for your interest in life insurance! I've prepared{' '}
              {data.quotes.length} personalized quote
              {data.quotes.length > 1 ? 's' : ''} from top-rated carriers based
              on your needs.
            </Text>
          </View>
        </View>

        {/* Quotes */}
        {data.quotes.map((quote, index) => (
          <View
            key={index}
            style={
              index === 0
                ? [styles.quoteCard, styles.bestValueCard]
                : styles.quoteCard
            }
          >
            {index === 0 && (
              <View style={styles.bestValueBadge}>
                <Text>BEST VALUE</Text>
              </View>
            )}

            <Text style={styles.carrierName}>{quote.carrierName}</Text>
            <Text style={styles.productName}>{quote.productName}</Text>

            <Text style={styles.premiumLabel}>Monthly Premium</Text>
            <Text style={styles.premium}>
              {formatCurrency(quote.monthlyPremium)}
            </Text>

            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Annual Premium:</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(quote.annualPremium)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Coverage Amount:</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(quote.faceAmount)}
                </Text>
              </View>
              {quote.term && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Term Length:</Text>
                  <Text style={styles.detailValue}>{quote.term} Years</Text>
                </View>
              )}
            </View>

            {quote.features && quote.features.length > 0 && (
              <View style={styles.featuresSection}>
                <Text style={styles.featuresTitle}>Features</Text>
                <View style={styles.featuresContainer}>
                  {quote.features.map((feature, featureIndex) => (
                    <View key={featureIndex} style={styles.feature}>
                      <Text>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ))}

        {/* Expiration Notice */}
        <View style={styles.expirationNotice}>
          <Text style={styles.expirationText}>
            <Text style={{ fontWeight: 'bold' }}>Important:</Text> These quotes
            are valid until {formatDate(data.expiresAt)}. After this date,
            rates may change based on updated underwriting guidelines.
          </Text>
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>{data.agentName}</Text>
          <Text style={styles.contactDetail}>Email: {data.agentEmail}</Text>
          {data.agentPhone && (
            <Text style={styles.contactDetail}>Phone: {data.agentPhone}</Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Quote generated on {formatDate(data.quoteDate)}
          </Text>
          <Text style={styles.disclaimer}>
            These quotes are estimates based on the information provided and are
            subject to underwriting approval. Final rates may vary based on
            medical exams and detailed underwriting review.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
