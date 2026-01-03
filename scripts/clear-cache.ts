#!/usr/bin/env tsx
/**
 * Cache Revalidation Script
 *
 * This script clears the Vercel cache after uploading new property data to Supabase.
 * Run this after updating properties to ensure fresh data is served.
 *
 * Usage:
 *   npm run clear-cache              # Clear all property caches
 *   npm run clear-cache -- --help    # Show help
 *   tsx scripts/clear-cache.ts       # Direct execution
 */

import 'dotenv/config';

interface RevalidateOptions {
  tags?: string[];
  paths?: string[];
  clearAll?: boolean;
}

async function revalidateCache(options: RevalidateOptions = {}) {
  const deploymentUrl = process.env.NEXT_PUBLIC_DEPLOYMENT_URL || process.env.VERCEL_URL;

  // Determine the API URL
  let apiUrl: string;
  if (process.env.NODE_ENV === 'production' && deploymentUrl) {
    apiUrl = `https://${deploymentUrl}/api/revalidate`;
  } else {
    apiUrl = 'http://localhost:3000/api/revalidate';
  }

  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    console.error('❌ Error: REVALIDATE_SECRET is not set in environment variables');
    console.error('Add it to your .env.local file or Vercel environment variables');
    process.exit(1);
  }

  console.log(`🔄 Sending revalidation request to: ${apiUrl}`);
  console.log('Options:', options);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': secret,
      },
      body: JSON.stringify(options),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Revalidation failed:', data);
      process.exit(1);
    }

    console.log('✅ Cache revalidated successfully!');
    console.log('📋 Details:', data);
    console.log('⏰ Timestamp:', data.timestamp);

    if (data.revalidated && data.revalidated.length > 0) {
      console.log('🗑️  Cleared caches:');
      data.revalidated.forEach((item: string) => console.log(`   - ${item}`));
    }

  } catch (error) {
    console.error('❌ Error during revalidation:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Cache Revalidation Script for Jávea Real Estate

Usage:
  npm run clear-cache                    Clear all property caches (default)
  npm run clear-cache -- --tags hot new  Clear specific tags
  npm run clear-cache -- --all           Clear all caches explicitly

Options:
  --all              Clear all property caches (default if no options provided)
  --tags <tags...>   Clear specific cache tags (e.g., properties-hot, properties-new)
  --help, -h         Show this help message

Available tags:
  properties              All property data (clears everything)
  properties-all          All properties list
  properties-hot          Hot/trending properties
  properties-new          New properties
  properties-most-liked   Most liked properties
  properties-type-house       Properties of type: house
  properties-type-apartment   Properties of type: apartment
  properties-type-investment  Properties of type: investment
  properties-type-plot        Properties of type: plot
  property-badges         Property badge data

Examples:
  # Clear all property caches after daily upload
  npm run clear-cache

  # Clear only hot and new property caches
  npm run clear-cache -- --tags properties-hot properties-new

Environment:
  Requires REVALIDATE_SECRET in .env.local or Vercel environment variables
  `);
  process.exit(0);
}

// Build options based on arguments
const options: RevalidateOptions = {};

if (args.includes('--tags')) {
  const tagIndex = args.indexOf('--tags');
  const tags = args.slice(tagIndex + 1).filter(arg => !arg.startsWith('--'));
  if (tags.length > 0) {
    options.tags = tags;
  }
}

if (args.includes('--all') || args.length === 0) {
  options.clearAll = true;
}

// Run the revalidation
revalidateCache(options);
