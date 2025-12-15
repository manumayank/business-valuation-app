/**
 * Migration: Seed Comprehensive Assessment Questions
 *
 * Adds comprehensive questions for all 12 assessment modules:
 * - Digital Advertising (NEW - 20 questions)
 * - E-Commerce & Online Sales (NEW - 20 questions)
 * - Content Strategy (NEW - 20 questions)
 * - Technology Stack (NEW - 20 questions)
 * - Digital Team & Capabilities (NEW - 20 questions)
 * - Additional questions for existing modules (Website, Social, SEO, Analytics, CRM, Reputation, Security)
 *
 * Total: ~200 new questions
 */

exports.up = async (db, run, get, all) => {
  console.log('🔨 Seeding comprehensive assessment questions...\n');

  // Helper to insert question with options
  const insertQuestion = async (moduleKey, question, options = []) => {
    const module = await get('SELECT id FROM assessment_modules WHERE module_key = ?', [moduleKey]);
    if (!module) {
      console.log(`  ⚠️  Module not found: ${moduleKey}`);
      return;
    }

    try {
      const result = await run(`
        INSERT INTO assessment_questions
          (module_id, question_key, question_text, description, help_text, field_type,
           max_score, is_required, is_owner_visible, quick_win_flag, implementation_effort,
           impact_level, category, subcategory, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        module.id,
        question.key,
        question.text,
        question.description || null,
        question.help_text || null,
        question.field_type || 'select',
        question.max_score || 10,
        question.required !== false ? 1 : 0,
        question.owner_visible !== false ? 1 : 0,
        question.quick_win ? 1 : 0,
        question.effort || null,
        question.impact || null,
        question.category || null,
        question.subcategory || null,
        question.order || 0
      ]);

      const questionId = result.lastID;

      // Insert options
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        await run(`
          INSERT INTO assessment_question_options
            (question_id, option_value, option_label, score, is_gap_indicator, quick_win_suggestion, order_index)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          questionId,
          opt.value,
          opt.label,
          opt.score || 0,
          opt.is_gap ? 1 : 0,
          opt.quick_win_suggestion || null,
          i
        ]);
      }
    } catch (err) {
      if (!err.message.includes('UNIQUE')) {
        console.log(`  ⚠️  ${question.key}: ${err.message}`);
      }
    }
  };

  // Standard rating options helper
  const ratingOptions = (labels = ['Poor', 'Below Average', 'Average', 'Good', 'Excellent']) => [
    { value: '1', label: labels[0], score: 2, is_gap: true, quick_win_suggestion: 'Immediate improvement needed' },
    { value: '2', label: labels[1], score: 4, is_gap: true, quick_win_suggestion: 'Consider improvements' },
    { value: '3', label: labels[2], score: 6 },
    { value: '4', label: labels[3], score: 8 },
    { value: '5', label: labels[4], score: 10 }
  ];

  const yesNoOptions = [
    { value: 'yes', label: 'Yes', score: 10 },
    { value: 'no', label: 'No', score: 0, is_gap: true }
  ];

  const yesNoPartialOptions = [
    { value: 'yes', label: 'Yes, fully', score: 10 },
    { value: 'partial', label: 'Partially', score: 5, is_gap: true },
    { value: 'no', label: 'No', score: 0, is_gap: true }
  ];

  const frequencyOptions = [
    { value: 'daily', label: 'Daily', score: 10 },
    { value: 'weekly', label: 'Weekly', score: 8 },
    { value: 'monthly', label: 'Monthly', score: 5, is_gap: true },
    { value: 'quarterly', label: 'Quarterly', score: 3, is_gap: true },
    { value: 'rarely', label: 'Rarely/Never', score: 0, is_gap: true }
  ];

  const maturityOptions = [
    { value: 'optimizing', label: 'Optimizing - Continuously improving', score: 10 },
    { value: 'managed', label: 'Managed - Measured and controlled', score: 8 },
    { value: 'defined', label: 'Defined - Standardized processes', score: 6 },
    { value: 'developing', label: 'Developing - Ad-hoc processes', score: 3, is_gap: true },
    { value: 'initial', label: 'Initial - No formal process', score: 0, is_gap: true }
  ];

  // ============================================
  // DIGITAL ADVERTISING MODULE (20 questions)
  // ============================================
  console.log('  Seeding Digital Advertising questions...');

  await insertQuestion('digital_advertising', {
    key: 'ads_google_ads_active',
    text: 'Does the business run Google Ads campaigns?',
    description: 'Search, Display, Shopping, or YouTube ads',
    field_type: 'select',
    category: 'Paid Search',
    quick_win: true,
    effort: 'medium',
    impact: 'high',
    order: 1
  }, [
    { value: 'active_optimized', label: 'Yes, actively managed and optimized', score: 10 },
    { value: 'active_basic', label: 'Yes, but basic management', score: 6, is_gap: true, quick_win_suggestion: 'Optimize Google Ads campaigns' },
    { value: 'paused', label: 'Had campaigns but paused', score: 3, is_gap: true },
    { value: 'never', label: 'Never used Google Ads', score: 0, is_gap: true, quick_win_suggestion: 'Consider Google Ads for targeted traffic' }
  ]);

  await insertQuestion('digital_advertising', {
    key: 'ads_facebook_meta_ads',
    text: 'Does the business run Facebook/Meta advertising?',
    description: 'Facebook, Instagram, Messenger, or Audience Network ads',
    field_type: 'select',
    category: 'Social Ads',
    quick_win: true,
    effort: 'medium',
    impact: 'high',
    order: 2
  }, [
    { value: 'active_optimized', label: 'Yes, actively managed with targeting', score: 10 },
    { value: 'active_basic', label: 'Yes, boosted posts only', score: 4, is_gap: true, quick_win_suggestion: 'Create proper ad campaigns instead of boosted posts' },
    { value: 'paused', label: 'Had campaigns but paused', score: 2, is_gap: true },
    { value: 'never', label: 'Never used Meta ads', score: 0 }
  ]);

  await insertQuestion('digital_advertising', {
    key: 'ads_linkedin_ads',
    text: 'Does the business use LinkedIn advertising? (B2B)',
    description: 'Sponsored content, InMail, or display ads',
    field_type: 'select',
    category: 'Social Ads',
    order: 3
  }, [
    { value: 'active', label: 'Yes, actively running', score: 10 },
    { value: 'occasional', label: 'Occasionally', score: 5 },
    { value: 'never', label: 'No LinkedIn ads', score: 0 },
    { value: 'na', label: 'Not applicable (B2C focus)', score: 8 }
  ]);

  await insertQuestion('digital_advertising', {
    key: 'ads_retargeting',
    text: 'Is retargeting/remarketing implemented?',
    description: 'Showing ads to people who previously visited the website',
    field_type: 'select',
    category: 'Retargeting',
    quick_win: true,
    effort: 'medium',
    impact: 'high',
    order: 4
  }, [
    { value: 'advanced', label: 'Yes, with segmented audiences', score: 10 },
    { value: 'basic', label: 'Yes, basic retargeting', score: 6 },
    { value: 'no', label: 'No retargeting', score: 0, is_gap: true, quick_win_suggestion: 'Implement retargeting for warm leads' }
  ]);

  await insertQuestion('digital_advertising', {
    key: 'ads_budget_monthly',
    text: 'What is the approximate monthly digital advertising budget?',
    field_type: 'select',
    category: 'Budget',
    order: 5
  }, [
    { value: '10k+', label: '$10,000+/month', score: 10 },
    { value: '5k-10k', label: '$5,000-$10,000/month', score: 8 },
    { value: '2k-5k', label: '$2,000-$5,000/month', score: 6 },
    { value: '500-2k', label: '$500-$2,000/month', score: 4 },
    { value: '<500', label: 'Less than $500/month', score: 2, is_gap: true },
    { value: 'none', label: 'No advertising budget', score: 0, is_gap: true }
  ]);

  await insertQuestion('digital_advertising', {
    key: 'ads_roas_tracking',
    text: 'Is Return on Ad Spend (ROAS) tracked?',
    description: 'Revenue generated from ads vs. cost',
    field_type: 'select',
    category: 'Performance',
    quick_win: true,
    effort: 'medium',
    impact: 'high',
    order: 6
  }, [
    { value: 'automated', label: 'Yes, with automated attribution', score: 10 },
    { value: 'manual', label: 'Yes, tracked manually', score: 6 },
    { value: 'partial', label: 'Partially tracked', score: 3, is_gap: true },
    { value: 'no', label: 'Not tracked', score: 0, is_gap: true, quick_win_suggestion: 'Implement ROAS tracking immediately' }
  ]);

  await insertQuestion('digital_advertising', {
    key: 'ads_conversion_tracking',
    text: 'Is conversion tracking properly configured?',
    description: 'Tracking form submissions, calls, purchases, etc.',
    field_type: 'select',
    category: 'Tracking',
    quick_win: true,
    effort: 'low',
    impact: 'high',
    order: 7
  }, [
    { value: 'full', label: 'Yes, all conversions tracked', score: 10 },
    { value: 'partial', label: 'Some conversions tracked', score: 5, is_gap: true, quick_win_suggestion: 'Complete conversion tracking setup' },
    { value: 'no', label: 'No conversion tracking', score: 0, is_gap: true, quick_win_suggestion: 'Set up conversion tracking urgently' }
  ]);

  await insertQuestion('digital_advertising', {
    key: 'ads_landing_pages',
    text: 'Are dedicated landing pages used for ad campaigns?',
    description: 'Custom pages designed to convert ad traffic',
    field_type: 'select',
    category: 'Conversion',
    quick_win: true,
    effort: 'medium',
    impact: 'high',
    order: 8
  }, [
    { value: 'optimized', label: 'Yes, A/B tested and optimized', score: 10 },
    { value: 'basic', label: 'Yes, basic landing pages', score: 6 },
    { value: 'homepage', label: 'No, traffic goes to homepage', score: 2, is_gap: true, quick_win_suggestion: 'Create dedicated landing pages for ads' },
    { value: 'no_ads', label: 'No advertising', score: 0 }
  ]);

  await insertQuestion('digital_advertising', {
    key: 'ads_audience_targeting',
    text: 'How sophisticated is audience targeting?',
    field_type: 'select',
    category: 'Targeting',
    order: 9
  }, [
    { value: 'advanced', label: 'Advanced (lookalikes, custom audiences, layered)', score: 10 },
    { value: 'moderate', label: 'Moderate (demographics + interests)', score: 7 },
    { value: 'basic', label: 'Basic (broad targeting)', score: 3, is_gap: true },
    { value: 'none', label: 'No targeting strategy', score: 0, is_gap: true }
  ]);

  await insertQuestion('digital_advertising', {
    key: 'ads_creative_testing',
    text: 'Is ad creative regularly tested and refreshed?',
    field_type: 'select',
    category: 'Creative',
    order: 10
  }, [
    { value: 'continuous', label: 'Continuous A/B testing', score: 10 },
    { value: 'regular', label: 'Regular updates (monthly)', score: 7 },
    { value: 'occasional', label: 'Occasional updates', score: 4, is_gap: true },
    { value: 'static', label: 'Same ads for long periods', score: 1, is_gap: true, quick_win_suggestion: 'Refresh ad creative regularly' }
  ]);

  await insertQuestion('digital_advertising', {
    key: 'ads_negative_keywords',
    text: 'Are negative keywords actively managed? (Search ads)',
    description: 'Preventing ads from showing for irrelevant searches',
    field_type: 'select',
    category: 'Optimization',
    quick_win: true,
    effort: 'low',
    impact: 'medium',
    order: 11
  }, [
    { value: 'proactive', label: 'Yes, proactively managed', score: 10 },
    { value: 'reactive', label: 'Updated occasionally', score: 5, is_gap: true },
    { value: 'no', label: 'Not managed', score: 0, is_gap: true, quick_win_suggestion: 'Add negative keywords to reduce wasted spend' },
    { value: 'na', label: 'Not running search ads', score: 5 }
  ]);

  await insertQuestion('digital_advertising', {
    key: 'ads_quality_score',
    text: 'What is the average Google Ads Quality Score?',
    help_text: 'Quality Score ranges from 1-10 for each keyword',
    field_type: 'select',
    category: 'Performance',
    order: 12
  }, [
    { value: '8-10', label: '8-10 (Excellent)', score: 10 },
    { value: '6-7', label: '6-7 (Good)', score: 7 },
    { value: '4-5', label: '4-5 (Average)', score: 4, is_gap: true },
    { value: '1-3', label: '1-3 (Poor)', score: 1, is_gap: true, quick_win_suggestion: 'Improve ad relevance and landing page experience' },
    { value: 'unknown', label: 'Unknown/Not tracked', score: 2, is_gap: true },
    { value: 'na', label: 'Not using Google Ads', score: 5 }
  ]);

  await insertQuestion('digital_advertising', {
    key: 'ads_bid_strategy',
    text: 'What bid strategy is primarily used?',
    field_type: 'select',
    category: 'Strategy',
    order: 13
  }, [
    { value: 'automated_roas', label: 'Automated (Target ROAS/CPA)', score: 10 },
    { value: 'automated_basic', label: 'Automated (Maximize Conversions)', score: 7 },
    { value: 'manual', label: 'Manual CPC', score: 5 },
    { value: 'maximize_clicks', label: 'Maximize Clicks only', score: 3, is_gap: true },
    { value: 'unknown', label: 'Unknown', score: 1, is_gap: true }
  ]);

  await insertQuestion('digital_advertising', {
    key: 'ads_display_network',
    text: 'Is Google Display Network advertising utilized?',
    field_type: 'select',
    category: 'Display',
    order: 14
  }, [
    { value: 'targeted', label: 'Yes, with specific placements/targeting', score: 10 },
    { value: 'remarketing', label: 'Yes, for remarketing only', score: 8 },
    { value: 'broad', label: 'Yes, broad targeting', score: 4, is_gap: true },
    { value: 'no', label: 'Not using display', score: 2 }
  ]);

  await insertQuestion('digital_advertising', {
    key: 'ads_video_advertising',
    text: 'Does the business use video advertising?',
    description: 'YouTube ads, social video ads, OTT/CTV',
    field_type: 'select',
    category: 'Video',
    order: 15
  }, [
    { value: 'multi_platform', label: 'Yes, multiple platforms', score: 10 },
    { value: 'single_platform', label: 'Yes, one platform', score: 7 },
    { value: 'planned', label: 'No, but planning to', score: 3 },
    { value: 'no', label: 'No video advertising', score: 0 }
  ]);

  await insertQuestion('digital_advertising', {
    key: 'ads_local_campaigns',
    text: 'Are location-based/local advertising campaigns run?',
    description: 'Local Service Ads, location targeting, store visits',
    field_type: 'select',
    category: 'Local',
    order: 16
  }, [
    { value: 'active', label: 'Yes, actively managed', score: 10 },
    { value: 'basic', label: 'Basic location targeting', score: 6 },
    { value: 'no', label: 'No local targeting', score: 2 },
    { value: 'na', label: 'Not applicable (online only)', score: 8 }
  ]);

  await insertQuestion('digital_advertising', {
    key: 'ads_competitor_monitoring',
    text: 'Is competitor advertising monitored?',
    field_type: 'select',
    category: 'Competitive',
    order: 17
  }, [
    { value: 'tools', label: 'Yes, with tools (SEMrush, SpyFu, etc.)', score: 10 },
    { value: 'manual', label: 'Yes, manually/occasionally', score: 5 },
    { value: 'no', label: 'No competitor monitoring', score: 0, is_gap: true }
  ]);

  await insertQuestion('digital_advertising', {
    key: 'ads_attribution_model',
    text: 'What attribution model is used?',
    description: 'How conversions are attributed to touchpoints',
    field_type: 'select',
    category: 'Attribution',
    order: 18
  }, [
    { value: 'data_driven', label: 'Data-driven attribution', score: 10 },
    { value: 'multi_touch', label: 'Multi-touch attribution', score: 8 },
    { value: 'first_last', label: 'First or last click', score: 5 },
    { value: 'unknown', label: 'Unknown/Not configured', score: 1, is_gap: true },
    { value: 'na', label: 'Not applicable', score: 5 }
  ]);

  await insertQuestion('digital_advertising', {
    key: 'ads_management',
    text: 'Who manages digital advertising?',
    field_type: 'select',
    category: 'Resources',
    order: 19
  }, [
    { value: 'agency', label: 'Specialized agency', score: 10 },
    { value: 'inhouse_expert', label: 'In-house specialist', score: 9 },
    { value: 'inhouse_part', label: 'In-house (part of other role)', score: 5, is_gap: true },
    { value: 'owner', label: 'Business owner', score: 3, is_gap: true },
    { value: 'none', label: 'No one currently', score: 0, is_gap: true }
  ]);

  await insertQuestion('digital_advertising', {
    key: 'ads_reporting_frequency',
    text: 'How often are advertising performance reports reviewed?',
    field_type: 'select',
    category: 'Reporting',
    order: 20
  }, frequencyOptions);

  console.log('  ✓ Digital Advertising questions seeded (20)');

  // ============================================
  // E-COMMERCE MODULE (20 questions)
  // ============================================
  console.log('  Seeding E-Commerce questions...');

  await insertQuestion('ecommerce', {
    key: 'ecom_platform',
    text: 'What e-commerce platform is used?',
    field_type: 'select',
    category: 'Platform',
    order: 1
  }, [
    { value: 'enterprise', label: 'Enterprise (Magento, Salesforce Commerce)', score: 10 },
    { value: 'shopify_plus', label: 'Shopify Plus/BigCommerce Enterprise', score: 9 },
    { value: 'shopify', label: 'Shopify/BigCommerce Standard', score: 8 },
    { value: 'woocommerce', label: 'WooCommerce', score: 7 },
    { value: 'other', label: 'Other platform', score: 5 },
    { value: 'none', label: 'No e-commerce', score: 0 }
  ]);

  await insertQuestion('ecommerce', {
    key: 'ecom_online_sales_percentage',
    text: 'What percentage of revenue comes from online sales?',
    field_type: 'select',
    category: 'Revenue',
    order: 2
  }, [
    { value: '75+', label: '75%+ (Primarily online)', score: 10 },
    { value: '50-75', label: '50-75%', score: 8 },
    { value: '25-50', label: '25-50%', score: 6 },
    { value: '10-25', label: '10-25%', score: 4 },
    { value: '<10', label: 'Less than 10%', score: 2 },
    { value: 'none', label: 'No online sales', score: 0, is_gap: true }
  ]);

  await insertQuestion('ecommerce', {
    key: 'ecom_payment_options',
    text: 'What payment options are available?',
    field_type: 'select',
    category: 'Payments',
    quick_win: true,
    effort: 'low',
    impact: 'high',
    order: 3
  }, [
    { value: 'comprehensive', label: 'All major cards, PayPal, Apple Pay, Google Pay, BNPL', score: 10 },
    { value: 'multiple', label: 'Cards + PayPal + one other', score: 8 },
    { value: 'basic', label: 'Credit cards + PayPal', score: 6 },
    { value: 'cards_only', label: 'Credit cards only', score: 3, is_gap: true, quick_win_suggestion: 'Add alternative payment methods' },
    { value: 'na', label: 'Not applicable', score: 5 }
  ]);

  await insertQuestion('ecommerce', {
    key: 'ecom_mobile_experience',
    text: 'How would you rate the mobile shopping experience?',
    field_type: 'select',
    category: 'Mobile',
    quick_win: true,
    effort: 'medium',
    impact: 'high',
    order: 4
  }, ratingOptions(['Very Poor', 'Needs Work', 'Acceptable', 'Good', 'Excellent']));

  await insertQuestion('ecommerce', {
    key: 'ecom_checkout_process',
    text: 'How streamlined is the checkout process?',
    description: 'Number of steps, guest checkout, saved info',
    field_type: 'select',
    category: 'Conversion',
    quick_win: true,
    effort: 'medium',
    impact: 'high',
    order: 5
  }, [
    { value: 'optimized', label: 'Single-page/one-click checkout', score: 10 },
    { value: 'streamlined', label: '2-3 step with guest checkout', score: 8 },
    { value: 'standard', label: 'Standard multi-step', score: 5 },
    { value: 'complex', label: 'Complex/lengthy process', score: 2, is_gap: true, quick_win_suggestion: 'Simplify checkout process' },
    { value: 'na', label: 'Not applicable', score: 5 }
  ]);

  await insertQuestion('ecommerce', {
    key: 'ecom_cart_abandonment',
    text: 'Is cart abandonment tracked and addressed?',
    field_type: 'select',
    category: 'Conversion',
    quick_win: true,
    effort: 'medium',
    impact: 'high',
    order: 6
  }, [
    { value: 'full', label: 'Yes, with recovery emails and retargeting', score: 10 },
    { value: 'email', label: 'Yes, abandonment emails only', score: 7 },
    { value: 'tracked', label: 'Tracked but no recovery', score: 3, is_gap: true },
    { value: 'no', label: 'Not tracked', score: 0, is_gap: true, quick_win_suggestion: 'Implement cart abandonment recovery' }
  ]);

  await insertQuestion('ecommerce', {
    key: 'ecom_product_descriptions',
    text: 'How comprehensive are product descriptions?',
    field_type: 'select',
    category: 'Content',
    order: 7
  }, [
    { value: 'comprehensive', label: 'Detailed with specs, benefits, use cases', score: 10 },
    { value: 'good', label: 'Good descriptions and specs', score: 7 },
    { value: 'basic', label: 'Basic descriptions', score: 4, is_gap: true },
    { value: 'minimal', label: 'Minimal/poor descriptions', score: 1, is_gap: true, quick_win_suggestion: 'Improve product descriptions' }
  ]);

  await insertQuestion('ecommerce', {
    key: 'ecom_product_images',
    text: 'What is the quality of product images?',
    field_type: 'select',
    category: 'Content',
    quick_win: true,
    effort: 'medium',
    impact: 'high',
    order: 8
  }, [
    { value: 'professional', label: 'Professional with multiple angles, zoom, 360°/video', score: 10 },
    { value: 'good', label: 'Good quality, multiple images', score: 7 },
    { value: 'basic', label: 'Single basic image per product', score: 3, is_gap: true, quick_win_suggestion: 'Add more product images' },
    { value: 'poor', label: 'Low quality images', score: 1, is_gap: true, quick_win_suggestion: 'Invest in professional product photography' }
  ]);

  await insertQuestion('ecommerce', {
    key: 'ecom_product_reviews',
    text: 'Are product reviews displayed on the site?',
    field_type: 'select',
    category: 'Social Proof',
    quick_win: true,
    effort: 'low',
    impact: 'high',
    order: 9
  }, [
    { value: 'verified', label: 'Yes, with verified purchase badges', score: 10 },
    { value: 'yes', label: 'Yes, reviews enabled', score: 7 },
    { value: 'importing', label: 'Imported from other platforms', score: 5 },
    { value: 'no', label: 'No reviews on site', score: 0, is_gap: true, quick_win_suggestion: 'Enable product reviews' }
  ]);

  await insertQuestion('ecommerce', {
    key: 'ecom_inventory_management',
    text: 'How is inventory managed?',
    field_type: 'select',
    category: 'Operations',
    order: 10
  }, [
    { value: 'automated', label: 'Automated with real-time sync', score: 10 },
    { value: 'integrated', label: 'Integrated with POS/ERP', score: 8 },
    { value: 'manual', label: 'Manual updates', score: 4, is_gap: true },
    { value: 'none', label: 'No inventory management', score: 0, is_gap: true }
  ]);

  await insertQuestion('ecommerce', {
    key: 'ecom_shipping_options',
    text: 'What shipping options are offered?',
    field_type: 'select',
    category: 'Fulfillment',
    order: 11
  }, [
    { value: 'comprehensive', label: 'Multiple carriers, express, free threshold', score: 10 },
    { value: 'multiple', label: 'Standard and express options', score: 7 },
    { value: 'single', label: 'Single shipping option', score: 4, is_gap: true },
    { value: 'na', label: 'Not applicable (digital only)', score: 8 }
  ]);

  await insertQuestion('ecommerce', {
    key: 'ecom_order_tracking',
    text: 'Is order tracking available to customers?',
    field_type: 'select',
    category: 'Fulfillment',
    quick_win: true,
    effort: 'low',
    impact: 'medium',
    order: 12
  }, [
    { value: 'realtime', label: 'Yes, real-time with notifications', score: 10 },
    { value: 'basic', label: 'Yes, basic tracking', score: 6 },
    { value: 'no', label: 'No order tracking', score: 0, is_gap: true, quick_win_suggestion: 'Implement order tracking' }
  ]);

  await insertQuestion('ecommerce', {
    key: 'ecom_search_functionality',
    text: 'How effective is the product search?',
    field_type: 'select',
    category: 'UX',
    order: 13
  }, [
    { value: 'advanced', label: 'Advanced with filters, autocomplete, AI suggestions', score: 10 },
    { value: 'good', label: 'Good with filters and categories', score: 7 },
    { value: 'basic', label: 'Basic keyword search', score: 4, is_gap: true },
    { value: 'poor', label: 'Poor or no search', score: 1, is_gap: true, quick_win_suggestion: 'Improve site search functionality' }
  ]);

  await insertQuestion('ecommerce', {
    key: 'ecom_personalization',
    text: 'Is personalization implemented?',
    description: 'Product recommendations, personalized content',
    field_type: 'select',
    category: 'Marketing',
    order: 14
  }, [
    { value: 'ai', label: 'AI-driven personalization', score: 10 },
    { value: 'rules', label: 'Rule-based recommendations', score: 7 },
    { value: 'basic', label: 'Basic "related products"', score: 4 },
    { value: 'none', label: 'No personalization', score: 0, is_gap: true }
  ]);

  await insertQuestion('ecommerce', {
    key: 'ecom_marketplace_presence',
    text: 'Does the business sell on marketplaces?',
    description: 'Amazon, eBay, Walmart, Etsy, etc.',
    field_type: 'select',
    category: 'Channels',
    order: 15
  }, [
    { value: 'multiple', label: 'Yes, multiple marketplaces', score: 10 },
    { value: 'single', label: 'Yes, one major marketplace', score: 7 },
    { value: 'planned', label: 'Planning to expand', score: 3 },
    { value: 'no', label: 'No marketplace presence', score: 2 },
    { value: 'na', label: 'Not applicable', score: 5 }
  ]);

  await insertQuestion('ecommerce', {
    key: 'ecom_return_policy',
    text: 'How customer-friendly is the return policy?',
    field_type: 'select',
    category: 'Policy',
    order: 16
  }, [
    { value: 'excellent', label: 'Excellent (30+ days, free returns, easy)', score: 10 },
    { value: 'good', label: 'Good (standard policy, clear process)', score: 7 },
    { value: 'restrictive', label: 'Restrictive policy', score: 3, is_gap: true },
    { value: 'unclear', label: 'Unclear or hidden policy', score: 1, is_gap: true, quick_win_suggestion: 'Clarify and display return policy' }
  ]);

  await insertQuestion('ecommerce', {
    key: 'ecom_upsell_crosssell',
    text: 'Are upselling and cross-selling implemented?',
    field_type: 'select',
    category: 'Marketing',
    quick_win: true,
    effort: 'medium',
    impact: 'high',
    order: 17
  }, [
    { value: 'automated', label: 'Yes, automated and optimized', score: 10 },
    { value: 'basic', label: 'Yes, basic implementation', score: 6 },
    { value: 'no', label: 'No upselling/cross-selling', score: 0, is_gap: true, quick_win_suggestion: 'Implement upselling and cross-selling' }
  ]);

  await insertQuestion('ecommerce', {
    key: 'ecom_subscription_model',
    text: 'Is a subscription model offered?',
    field_type: 'select',
    category: 'Revenue Model',
    order: 18
  }, [
    { value: 'active', label: 'Yes, actively promoted', score: 10 },
    { value: 'available', label: 'Available as an option', score: 7 },
    { value: 'planned', label: 'Planning to add', score: 3 },
    { value: 'no', label: 'No subscription model', score: 2 },
    { value: 'na', label: 'Not applicable', score: 5 }
  ]);

  await insertQuestion('ecommerce', {
    key: 'ecom_live_chat',
    text: 'Is live chat/chatbot available for shoppers?',
    field_type: 'select',
    category: 'Support',
    quick_win: true,
    effort: 'low',
    impact: 'medium',
    order: 19
  }, [
    { value: 'both', label: 'Yes, live chat + chatbot', score: 10 },
    { value: 'live', label: 'Live chat only', score: 8 },
    { value: 'chatbot', label: 'Chatbot only', score: 6 },
    { value: 'no', label: 'No chat support', score: 2, is_gap: true, quick_win_suggestion: 'Add chat support for shoppers' }
  ]);

  await insertQuestion('ecommerce', {
    key: 'ecom_conversion_rate',
    text: 'What is the approximate e-commerce conversion rate?',
    help_text: 'Average e-commerce conversion rate is 2-3%',
    field_type: 'select',
    category: 'Performance',
    order: 20
  }, [
    { value: '5+', label: '5%+ (Excellent)', score: 10 },
    { value: '3-5', label: '3-5% (Good)', score: 8 },
    { value: '2-3', label: '2-3% (Average)', score: 6 },
    { value: '1-2', label: '1-2% (Below average)', score: 3, is_gap: true },
    { value: '<1', label: 'Below 1%', score: 1, is_gap: true, quick_win_suggestion: 'Audit and improve conversion funnel' },
    { value: 'unknown', label: 'Unknown', score: 2, is_gap: true }
  ]);

  console.log('  ✓ E-Commerce questions seeded (20)');

  // ============================================
  // CONTENT STRATEGY MODULE (20 questions)
  // ============================================
  console.log('  Seeding Content Strategy questions...');

  await insertQuestion('content_strategy', {
    key: 'content_strategy_exists',
    text: 'Is there a documented content strategy?',
    field_type: 'select',
    category: 'Strategy',
    order: 1
  }, [
    { value: 'comprehensive', label: 'Yes, comprehensive documented strategy', score: 10 },
    { value: 'basic', label: 'Yes, basic guidelines', score: 6 },
    { value: 'informal', label: 'Informal/undocumented', score: 3, is_gap: true },
    { value: 'none', label: 'No content strategy', score: 0, is_gap: true, quick_win_suggestion: 'Develop a content strategy' }
  ]);

  await insertQuestion('content_strategy', {
    key: 'content_calendar',
    text: 'Is a content calendar used?',
    field_type: 'select',
    category: 'Planning',
    quick_win: true,
    effort: 'low',
    impact: 'medium',
    order: 2
  }, [
    { value: 'detailed', label: 'Yes, detailed with themes and campaigns', score: 10 },
    { value: 'basic', label: 'Yes, basic scheduling', score: 6 },
    { value: 'no', label: 'No content calendar', score: 0, is_gap: true, quick_win_suggestion: 'Create a content calendar' }
  ]);

  await insertQuestion('content_strategy', {
    key: 'content_blog_frequency',
    text: 'How often is new blog content published?',
    field_type: 'select',
    category: 'Production',
    order: 3
  }, [
    { value: 'daily', label: 'Daily or multiple times per week', score: 10 },
    { value: 'weekly', label: 'Weekly', score: 8 },
    { value: 'biweekly', label: 'Bi-weekly', score: 6 },
    { value: 'monthly', label: 'Monthly', score: 4, is_gap: true },
    { value: 'rarely', label: 'Rarely', score: 2, is_gap: true },
    { value: 'never', label: 'No blog content', score: 0, is_gap: true }
  ]);

  await insertQuestion('content_strategy', {
    key: 'content_quality_rating',
    text: 'How would you rate the quality of content produced?',
    field_type: 'select',
    category: 'Quality',
    order: 4
  }, ratingOptions(['Very Low Quality', 'Low Quality', 'Average', 'High Quality', 'Exceptional Quality']));

  await insertQuestion('content_strategy', {
    key: 'content_types_variety',
    text: 'What types of content are produced?',
    description: 'Blog posts, videos, podcasts, infographics, ebooks, etc.',
    field_type: 'select',
    category: 'Format',
    order: 5
  }, [
    { value: 'diverse', label: '5+ content types (blog, video, podcast, etc.)', score: 10 },
    { value: 'moderate', label: '3-4 content types', score: 7 },
    { value: 'limited', label: '1-2 content types', score: 4, is_gap: true },
    { value: 'none', label: 'No regular content', score: 0, is_gap: true }
  ]);

  await insertQuestion('content_strategy', {
    key: 'content_video_presence',
    text: 'Is video content being created?',
    field_type: 'select',
    category: 'Video',
    order: 6
  }, [
    { value: 'regular', label: 'Yes, regularly produced', score: 10 },
    { value: 'occasional', label: 'Yes, occasionally', score: 6 },
    { value: 'planned', label: 'Planning to start', score: 3 },
    { value: 'no', label: 'No video content', score: 0, is_gap: true }
  ]);

  await insertQuestion('content_strategy', {
    key: 'content_seo_optimization',
    text: 'Is content optimized for SEO?',
    field_type: 'select',
    category: 'SEO',
    quick_win: true,
    effort: 'medium',
    impact: 'high',
    order: 7
  }, [
    { value: 'comprehensive', label: 'Yes, comprehensive SEO optimization', score: 10 },
    { value: 'basic', label: 'Basic keyword targeting', score: 5, is_gap: true },
    { value: 'no', label: 'No SEO optimization', score: 0, is_gap: true, quick_win_suggestion: 'Implement SEO best practices in content' }
  ]);

  await insertQuestion('content_strategy', {
    key: 'content_buyer_journey',
    text: 'Is content created for different stages of the buyer journey?',
    description: 'Awareness, consideration, decision stages',
    field_type: 'select',
    category: 'Strategy',
    order: 8
  }, [
    { value: 'mapped', label: 'Yes, content mapped to each stage', score: 10 },
    { value: 'partial', label: 'Some stage-specific content', score: 5, is_gap: true },
    { value: 'no', label: 'No buyer journey mapping', score: 0, is_gap: true }
  ]);

  await insertQuestion('content_strategy', {
    key: 'content_repurposing',
    text: 'Is content repurposed across channels?',
    description: 'Blog to social, video to blog, etc.',
    field_type: 'select',
    category: 'Efficiency',
    quick_win: true,
    effort: 'low',
    impact: 'medium',
    order: 9
  }, [
    { value: 'systematic', label: 'Yes, systematic repurposing', score: 10 },
    { value: 'occasional', label: 'Occasionally repurposed', score: 5 },
    { value: 'no', label: 'Content not repurposed', score: 0, is_gap: true, quick_win_suggestion: 'Repurpose content across channels' }
  ]);

  await insertQuestion('content_strategy', {
    key: 'content_email_newsletters',
    text: 'Is email newsletter content sent regularly?',
    field_type: 'select',
    category: 'Email',
    quick_win: true,
    effort: 'medium',
    impact: 'high',
    order: 10
  }, [
    { value: 'weekly', label: 'Weekly or more', score: 10 },
    { value: 'biweekly', label: 'Bi-weekly', score: 8 },
    { value: 'monthly', label: 'Monthly', score: 6 },
    { value: 'rarely', label: 'Rarely', score: 3, is_gap: true },
    { value: 'never', label: 'No newsletters', score: 0, is_gap: true }
  ]);

  await insertQuestion('content_strategy', {
    key: 'content_user_generated',
    text: 'Is user-generated content leveraged?',
    description: 'Customer photos, reviews, testimonials, stories',
    field_type: 'select',
    category: 'UGC',
    order: 11
  }, [
    { value: 'active', label: 'Yes, actively encouraged and showcased', score: 10 },
    { value: 'some', label: 'Some UGC used', score: 6 },
    { value: 'no', label: 'No UGC strategy', score: 0, is_gap: true }
  ]);

  await insertQuestion('content_strategy', {
    key: 'content_thought_leadership',
    text: 'Is thought leadership content produced?',
    description: 'Industry insights, original research, expert opinions',
    field_type: 'select',
    category: 'Thought Leadership',
    order: 12
  }, [
    { value: 'regular', label: 'Yes, regular thought leadership', score: 10 },
    { value: 'occasional', label: 'Occasional pieces', score: 6 },
    { value: 'no', label: 'No thought leadership', score: 0, is_gap: true }
  ]);

  await insertQuestion('content_strategy', {
    key: 'content_gated_content',
    text: 'Is gated content (lead magnets) offered?',
    description: 'Ebooks, whitepapers, webinars requiring email',
    field_type: 'select',
    category: 'Lead Generation',
    quick_win: true,
    effort: 'medium',
    impact: 'high',
    order: 13
  }, [
    { value: 'multiple', label: 'Yes, multiple lead magnets', score: 10 },
    { value: 'single', label: 'Yes, one or two', score: 6 },
    { value: 'no', label: 'No gated content', score: 0, is_gap: true, quick_win_suggestion: 'Create lead magnet content' }
  ]);

  await insertQuestion('content_strategy', {
    key: 'content_evergreen_updating',
    text: 'Is evergreen content regularly updated?',
    field_type: 'select',
    category: 'Maintenance',
    quick_win: true,
    effort: 'low',
    impact: 'medium',
    order: 14
  }, [
    { value: 'systematic', label: 'Yes, systematic content audits', score: 10 },
    { value: 'occasional', label: 'Updated occasionally', score: 5, is_gap: true },
    { value: 'never', label: 'Content not updated', score: 0, is_gap: true, quick_win_suggestion: 'Audit and update old content' }
  ]);

  await insertQuestion('content_strategy', {
    key: 'content_competitor_analysis',
    text: 'Is competitor content analyzed?',
    field_type: 'select',
    category: 'Research',
    order: 15
  }, [
    { value: 'regular', label: 'Yes, regular competitive analysis', score: 10 },
    { value: 'occasional', label: 'Occasionally reviewed', score: 5 },
    { value: 'no', label: 'No competitor analysis', score: 0, is_gap: true }
  ]);

  await insertQuestion('content_strategy', {
    key: 'content_brand_voice',
    text: 'Is there a defined brand voice and style guide?',
    field_type: 'select',
    category: 'Branding',
    order: 16
  }, [
    { value: 'comprehensive', label: 'Yes, comprehensive style guide', score: 10 },
    { value: 'basic', label: 'Basic guidelines', score: 5, is_gap: true },
    { value: 'no', label: 'No defined brand voice', score: 0, is_gap: true, quick_win_suggestion: 'Create brand voice guidelines' }
  ]);

  await insertQuestion('content_strategy', {
    key: 'content_performance_tracking',
    text: 'Is content performance tracked?',
    field_type: 'select',
    category: 'Analytics',
    quick_win: true,
    effort: 'low',
    impact: 'high',
    order: 17
  }, [
    { value: 'detailed', label: 'Yes, detailed metrics and KPIs', score: 10 },
    { value: 'basic', label: 'Basic views/engagement tracking', score: 5, is_gap: true },
    { value: 'no', label: 'No tracking', score: 0, is_gap: true, quick_win_suggestion: 'Implement content performance tracking' }
  ]);

  await insertQuestion('content_strategy', {
    key: 'content_internal_resources',
    text: 'Who creates content?',
    field_type: 'select',
    category: 'Resources',
    order: 18
  }, [
    { value: 'team', label: 'Dedicated content team', score: 10 },
    { value: 'mixed', label: 'Mix of in-house and freelance', score: 8 },
    { value: 'freelance', label: 'Freelancers/agency only', score: 6 },
    { value: 'owner', label: 'Business owner', score: 4, is_gap: true },
    { value: 'none', label: 'No regular content creation', score: 0, is_gap: true }
  ]);

  await insertQuestion('content_strategy', {
    key: 'content_case_studies',
    text: 'Are case studies or success stories published?',
    field_type: 'select',
    category: 'Social Proof',
    quick_win: true,
    effort: 'medium',
    impact: 'high',
    order: 19
  }, [
    { value: 'multiple', label: 'Yes, multiple detailed case studies', score: 10 },
    { value: 'few', label: 'A few case studies', score: 6 },
    { value: 'no', label: 'No case studies', score: 0, is_gap: true, quick_win_suggestion: 'Create customer case studies' }
  ]);

  await insertQuestion('content_strategy', {
    key: 'content_distribution',
    text: 'How is content distributed?',
    field_type: 'select',
    category: 'Distribution',
    order: 20
  }, [
    { value: 'omnichannel', label: 'Multi-channel with paid promotion', score: 10 },
    { value: 'multiple', label: 'Multiple organic channels', score: 7 },
    { value: 'limited', label: 'Website and one social channel', score: 4, is_gap: true },
    { value: 'website', label: 'Website only', score: 2, is_gap: true }
  ]);

  console.log('  ✓ Content Strategy questions seeded (20)');

  // ============================================
  // TECHNOLOGY STACK MODULE (20 questions)
  // ============================================
  console.log('  Seeding Technology Stack questions...');

  await insertQuestion('technology_stack', {
    key: 'tech_website_platform',
    text: 'What platform is the website built on?',
    field_type: 'select',
    category: 'Web Platform',
    order: 1
  }, [
    { value: 'custom', label: 'Custom/headless CMS', score: 10 },
    { value: 'enterprise', label: 'Enterprise CMS (Adobe, Sitecore)', score: 9 },
    { value: 'wordpress', label: 'WordPress', score: 7 },
    { value: 'squarespace', label: 'Squarespace/Wix/Website builders', score: 5 },
    { value: 'static', label: 'Static HTML/No CMS', score: 3, is_gap: true },
    { value: 'unknown', label: 'Unknown', score: 2, is_gap: true }
  ]);

  await insertQuestion('technology_stack', {
    key: 'tech_hosting_quality',
    text: 'What is the hosting/infrastructure quality?',
    field_type: 'select',
    category: 'Infrastructure',
    order: 2
  }, [
    { value: 'cloud_enterprise', label: 'Enterprise cloud (AWS, Azure, GCP)', score: 10 },
    { value: 'managed', label: 'Managed hosting (WP Engine, Kinsta)', score: 8 },
    { value: 'vps', label: 'VPS hosting', score: 6 },
    { value: 'shared', label: 'Shared hosting', score: 3, is_gap: true, quick_win_suggestion: 'Upgrade to better hosting' },
    { value: 'unknown', label: 'Unknown', score: 2, is_gap: true }
  ]);

  await insertQuestion('technology_stack', {
    key: 'tech_integrations_count',
    text: 'How many systems are integrated (CRM, email, analytics, etc.)?',
    field_type: 'select',
    category: 'Integration',
    order: 3
  }, [
    { value: '10+', label: '10+ integrated systems', score: 10 },
    { value: '5-10', label: '5-10 systems', score: 8 },
    { value: '2-4', label: '2-4 systems', score: 5 },
    { value: '1', label: '1 or no integrations', score: 2, is_gap: true }
  ]);

  await insertQuestion('technology_stack', {
    key: 'tech_api_capabilities',
    text: 'Does the business have API capabilities?',
    description: 'Ability to connect with partners, apps, custom integrations',
    field_type: 'select',
    category: 'Integration',
    order: 4
  }, [
    { value: 'full', label: 'Yes, full API access and documentation', score: 10 },
    { value: 'limited', label: 'Limited API capabilities', score: 6 },
    { value: 'zapier', label: 'Zapier/webhook only', score: 4 },
    { value: 'none', label: 'No API capabilities', score: 0 }
  ]);

  await insertQuestion('technology_stack', {
    key: 'tech_automation_tools',
    text: 'What automation tools are in use?',
    field_type: 'select',
    category: 'Automation',
    order: 5
  }, [
    { value: 'enterprise', label: 'Enterprise automation (Workato, MuleSoft)', score: 10 },
    { value: 'intermediate', label: 'Intermediate (Zapier, Make)', score: 7 },
    { value: 'basic', label: 'Basic automation', score: 4 },
    { value: 'none', label: 'No automation tools', score: 0, is_gap: true }
  ]);

  await insertQuestion('technology_stack', {
    key: 'tech_data_warehouse',
    text: 'Is a data warehouse or data lake implemented?',
    field_type: 'select',
    category: 'Data',
    order: 6
  }, [
    { value: 'advanced', label: 'Yes, with BI tools connected', score: 10 },
    { value: 'basic', label: 'Yes, basic implementation', score: 7 },
    { value: 'planned', label: 'Planning to implement', score: 3 },
    { value: 'no', label: 'No data warehouse', score: 0 }
  ]);

  await insertQuestion('technology_stack', {
    key: 'tech_mobile_app',
    text: 'Does the business have a mobile app?',
    field_type: 'select',
    category: 'Mobile',
    order: 7
  }, [
    { value: 'native', label: 'Yes, native iOS and Android', score: 10 },
    { value: 'hybrid', label: 'Yes, hybrid/cross-platform', score: 8 },
    { value: 'pwa', label: 'Progressive Web App (PWA)', score: 6 },
    { value: 'planned', label: 'Planning to develop', score: 3 },
    { value: 'no', label: 'No mobile app', score: 0 },
    { value: 'na', label: 'Not needed for business', score: 7 }
  ]);

  await insertQuestion('technology_stack', {
    key: 'tech_single_sign_on',
    text: 'Is Single Sign-On (SSO) implemented?',
    field_type: 'select',
    category: 'Security',
    order: 8
  }, [
    { value: 'yes', label: 'Yes, enterprise SSO', score: 10 },
    { value: 'google', label: 'Social login (Google, etc.)', score: 6 },
    { value: 'no', label: 'No SSO', score: 2 }
  ]);

  await insertQuestion('technology_stack', {
    key: 'tech_cloud_services',
    text: 'What cloud services are utilized?',
    field_type: 'select',
    category: 'Cloud',
    order: 9
  }, [
    { value: 'full', label: 'Full cloud infrastructure', score: 10 },
    { value: 'hybrid', label: 'Hybrid cloud approach', score: 8 },
    { value: 'saas', label: 'SaaS tools only', score: 6 },
    { value: 'minimal', label: 'Minimal cloud usage', score: 3 },
    { value: 'none', label: 'No cloud services', score: 0, is_gap: true }
  ]);

  await insertQuestion('technology_stack', {
    key: 'tech_documentation',
    text: 'Is technical documentation maintained?',
    field_type: 'select',
    category: 'Documentation',
    order: 10
  }, [
    { value: 'comprehensive', label: 'Yes, comprehensive and current', score: 10 },
    { value: 'basic', label: 'Basic documentation', score: 5, is_gap: true },
    { value: 'outdated', label: 'Outdated documentation', score: 2, is_gap: true },
    { value: 'none', label: 'No documentation', score: 0, is_gap: true, quick_win_suggestion: 'Create technical documentation' }
  ]);

  await insertQuestion('technology_stack', {
    key: 'tech_disaster_recovery',
    text: 'Is a disaster recovery plan in place?',
    field_type: 'select',
    category: 'Business Continuity',
    order: 11
  }, [
    { value: 'tested', label: 'Yes, documented and tested', score: 10 },
    { value: 'documented', label: 'Yes, documented but untested', score: 6, is_gap: true },
    { value: 'informal', label: 'Informal plan', score: 3, is_gap: true },
    { value: 'none', label: 'No disaster recovery plan', score: 0, is_gap: true, quick_win_suggestion: 'Create disaster recovery plan' }
  ]);

  await insertQuestion('technology_stack', {
    key: 'tech_uptime_monitoring',
    text: 'Is system uptime monitored?',
    field_type: 'select',
    category: 'Monitoring',
    order: 12
  }, [
    { value: 'comprehensive', label: 'Yes, with alerting and dashboards', score: 10 },
    { value: 'basic', label: 'Basic uptime monitoring', score: 6 },
    { value: 'no', label: 'No monitoring', score: 0, is_gap: true, quick_win_suggestion: 'Implement uptime monitoring' }
  ]);

  await insertQuestion('technology_stack', {
    key: 'tech_dev_practices',
    text: 'What development practices are followed?',
    field_type: 'select',
    category: 'Development',
    order: 13
  }, [
    { value: 'devops', label: 'DevOps with CI/CD', score: 10 },
    { value: 'agile', label: 'Agile with version control', score: 8 },
    { value: 'basic', label: 'Basic version control', score: 5 },
    { value: 'none', label: 'No formal practices', score: 0, is_gap: true }
  ]);

  await insertQuestion('technology_stack', {
    key: 'tech_scalability',
    text: 'How scalable is the current technology stack?',
    field_type: 'select',
    category: 'Scalability',
    order: 14
  }, [
    { value: 'auto_scale', label: 'Auto-scaling capabilities', score: 10 },
    { value: 'scalable', label: 'Scalable with manual intervention', score: 7 },
    { value: 'limited', label: 'Limited scalability', score: 4, is_gap: true },
    { value: 'constraints', label: 'Significant scaling constraints', score: 1, is_gap: true }
  ]);

  await insertQuestion('technology_stack', {
    key: 'tech_vendor_dependency',
    text: 'How dependent is the business on single vendors?',
    field_type: 'select',
    category: 'Risk',
    order: 15
  }, [
    { value: 'diversified', label: 'Well diversified', score: 10 },
    { value: 'moderate', label: 'Moderate dependency', score: 6 },
    { value: 'high', label: 'High dependency on 1-2 vendors', score: 3, is_gap: true },
    { value: 'critical', label: 'Critical single vendor dependency', score: 1, is_gap: true }
  ]);

  await insertQuestion('technology_stack', {
    key: 'tech_legacy_systems',
    text: 'Are legacy systems still in use?',
    field_type: 'select',
    category: 'Modernization',
    order: 16
  }, [
    { value: 'none', label: 'No legacy systems', score: 10 },
    { value: 'isolated', label: 'Legacy isolated and planned for replacement', score: 7 },
    { value: 'integrated', label: 'Legacy integrated but functional', score: 4, is_gap: true },
    { value: 'critical', label: 'Business-critical legacy systems', score: 1, is_gap: true }
  ]);

  await insertQuestion('technology_stack', {
    key: 'tech_ai_ml_usage',
    text: 'Is AI/Machine Learning used in any processes?',
    field_type: 'select',
    category: 'Innovation',
    order: 17
  }, [
    { value: 'integrated', label: 'Yes, integrated into core processes', score: 10 },
    { value: 'experimenting', label: 'Experimenting/pilot projects', score: 6 },
    { value: 'planned', label: 'Planning to implement', score: 3 },
    { value: 'no', label: 'No AI/ML usage', score: 0 }
  ]);

  await insertQuestion('technology_stack', {
    key: 'tech_payment_processing',
    text: 'What payment processing technology is used?',
    field_type: 'select',
    category: 'Payments',
    order: 18
  }, [
    { value: 'enterprise', label: 'Enterprise payment gateway', score: 10 },
    { value: 'stripe', label: 'Modern processors (Stripe, Square)', score: 8 },
    { value: 'traditional', label: 'Traditional merchant account', score: 5 },
    { value: 'basic', label: 'Basic PayPal only', score: 3 },
    { value: 'na', label: 'Not applicable', score: 7 }
  ]);

  await insertQuestion('technology_stack', {
    key: 'tech_communication_tools',
    text: 'What communication/collaboration tools are used?',
    field_type: 'select',
    category: 'Communication',
    order: 19
  }, [
    { value: 'integrated', label: 'Integrated suite (Microsoft 365, Google Workspace)', score: 10 },
    { value: 'multiple', label: 'Multiple specialized tools', score: 7 },
    { value: 'basic', label: 'Basic email only', score: 3, is_gap: true }
  ]);

  await insertQuestion('technology_stack', {
    key: 'tech_refresh_cycle',
    text: 'How often is technology reviewed and updated?',
    field_type: 'select',
    category: 'Maintenance',
    order: 20
  }, [
    { value: 'continuous', label: 'Continuous improvement', score: 10 },
    { value: 'annual', label: 'Annual tech reviews', score: 7 },
    { value: 'adhoc', label: 'Ad-hoc when issues arise', score: 3, is_gap: true },
    { value: 'rarely', label: 'Rarely updated', score: 1, is_gap: true }
  ]);

  console.log('  ✓ Technology Stack questions seeded (20)');

  // ============================================
  // DIGITAL TEAM & CAPABILITIES MODULE (20 questions)
  // ============================================
  console.log('  Seeding Digital Team & Capabilities questions...');

  await insertQuestion('team_capabilities', {
    key: 'team_digital_roles',
    text: 'Are there dedicated digital marketing roles?',
    field_type: 'select',
    category: 'Structure',
    order: 1
  }, [
    { value: 'team', label: 'Yes, dedicated digital team', score: 10 },
    { value: 'specialist', label: 'Yes, one specialist', score: 7 },
    { value: 'shared', label: 'Shared responsibilities', score: 4, is_gap: true },
    { value: 'none', label: 'No dedicated digital roles', score: 0, is_gap: true, quick_win_suggestion: 'Consider hiring digital specialist' }
  ]);

  await insertQuestion('team_capabilities', {
    key: 'team_size',
    text: 'What is the size of the digital/marketing team?',
    field_type: 'select',
    category: 'Resources',
    order: 2
  }, [
    { value: '10+', label: '10+ people', score: 10 },
    { value: '5-10', label: '5-10 people', score: 8 },
    { value: '2-4', label: '2-4 people', score: 6 },
    { value: '1', label: '1 person', score: 4 },
    { value: '0', label: 'No dedicated resources', score: 0, is_gap: true }
  ]);

  await insertQuestion('team_capabilities', {
    key: 'team_skills_assessment',
    text: 'How would you rate overall digital skill level?',
    field_type: 'select',
    category: 'Skills',
    order: 3
  }, ratingOptions(['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert']));

  await insertQuestion('team_capabilities', {
    key: 'team_training_budget',
    text: 'Is there a training budget for digital skills?',
    field_type: 'select',
    category: 'Development',
    order: 4
  }, [
    { value: 'dedicated', label: 'Yes, dedicated training budget', score: 10 },
    { value: 'adhoc', label: 'Training funded ad-hoc', score: 5 },
    { value: 'none', label: 'No training budget', score: 0, is_gap: true, quick_win_suggestion: 'Allocate training budget for digital skills' }
  ]);

  await insertQuestion('team_capabilities', {
    key: 'team_certifications',
    text: 'Do team members have relevant certifications?',
    description: 'Google Ads, Analytics, HubSpot, Meta, etc.',
    field_type: 'select',
    category: 'Credentials',
    order: 5
  }, [
    { value: 'multiple', label: 'Yes, multiple certifications held', score: 10 },
    { value: 'some', label: 'Some certifications', score: 6 },
    { value: 'none', label: 'No certifications', score: 0, is_gap: true, quick_win_suggestion: 'Encourage team to get digital certifications' }
  ]);

  await insertQuestion('team_capabilities', {
    key: 'team_agency_support',
    text: 'Is an agency or external support used?',
    field_type: 'select',
    category: 'Support',
    order: 6
  }, [
    { value: 'strategic', label: 'Yes, strategic agency partner', score: 10 },
    { value: 'execution', label: 'Yes, for execution support', score: 7 },
    { value: 'freelance', label: 'Freelancers as needed', score: 5 },
    { value: 'no', label: 'No external support', score: 3 }
  ]);

  await insertQuestion('team_capabilities', {
    key: 'team_data_literacy',
    text: 'How data-literate is the team?',
    description: 'Ability to interpret and act on data',
    field_type: 'select',
    category: 'Data Skills',
    order: 7
  }, [
    { value: 'advanced', label: 'Advanced data analysis skills', score: 10 },
    { value: 'intermediate', label: 'Can interpret reports', score: 6 },
    { value: 'basic', label: 'Basic data understanding', score: 3, is_gap: true },
    { value: 'low', label: 'Limited data literacy', score: 0, is_gap: true }
  ]);

  await insertQuestion('team_capabilities', {
    key: 'team_content_creation',
    text: 'Does the team have content creation capabilities?',
    description: 'Writing, design, video, photography',
    field_type: 'select',
    category: 'Creative',
    order: 8
  }, [
    { value: 'full', label: 'Full in-house capabilities', score: 10 },
    { value: 'partial', label: 'Some capabilities, outsource others', score: 7 },
    { value: 'outsourced', label: 'Fully outsourced', score: 5 },
    { value: 'limited', label: 'Limited capabilities', score: 2, is_gap: true }
  ]);

  await insertQuestion('team_capabilities', {
    key: 'team_technical_skills',
    text: 'What technical digital skills exist in-house?',
    description: 'HTML/CSS, basic coding, platform administration',
    field_type: 'select',
    category: 'Technical',
    order: 9
  }, [
    { value: 'developer', label: 'Full development capabilities', score: 10 },
    { value: 'admin', label: 'Platform administration skills', score: 7 },
    { value: 'basic', label: 'Basic technical skills', score: 4 },
    { value: 'none', label: 'No technical skills', score: 0, is_gap: true }
  ]);

  await insertQuestion('team_capabilities', {
    key: 'team_executive_buy_in',
    text: 'Is there executive support for digital initiatives?',
    field_type: 'select',
    category: 'Leadership',
    order: 10
  }, [
    { value: 'champion', label: 'Yes, executive champion', score: 10 },
    { value: 'supportive', label: 'Supportive of initiatives', score: 7 },
    { value: 'passive', label: 'Passive acceptance', score: 4, is_gap: true },
    { value: 'resistant', label: 'Resistance to digital', score: 0, is_gap: true }
  ]);

  await insertQuestion('team_capabilities', {
    key: 'team_digital_maturity',
    text: 'What is the overall digital maturity of the organization?',
    field_type: 'select',
    category: 'Maturity',
    order: 11
  }, maturityOptions);

  await insertQuestion('team_capabilities', {
    key: 'team_innovation_culture',
    text: 'How is digital innovation encouraged?',
    field_type: 'select',
    category: 'Culture',
    order: 12
  }, [
    { value: 'proactive', label: 'Proactive innovation program', score: 10 },
    { value: 'encouraged', label: 'Ideas encouraged and considered', score: 7 },
    { value: 'passive', label: 'Limited focus on innovation', score: 3, is_gap: true },
    { value: 'none', label: 'No innovation focus', score: 0, is_gap: true }
  ]);

  await insertQuestion('team_capabilities', {
    key: 'team_collaboration_tools',
    text: 'How effectively are collaboration tools used?',
    field_type: 'select',
    category: 'Collaboration',
    order: 13
  }, ratingOptions(['Not Used', 'Poorly', 'Moderately', 'Well', 'Excellently']));

  await insertQuestion('team_capabilities', {
    key: 'team_remote_capability',
    text: 'Can the team work effectively remotely?',
    field_type: 'select',
    category: 'Flexibility',
    order: 14
  }, [
    { value: 'fully', label: 'Fully remote capable', score: 10 },
    { value: 'hybrid', label: 'Hybrid capable', score: 8 },
    { value: 'limited', label: 'Limited remote capability', score: 4, is_gap: true },
    { value: 'none', label: 'No remote capability', score: 0, is_gap: true }
  ]);

  await insertQuestion('team_capabilities', {
    key: 'team_customer_journey_understanding',
    text: 'Does the team understand the digital customer journey?',
    field_type: 'select',
    category: 'Customer Focus',
    order: 15
  }, [
    { value: 'mapped', label: 'Yes, journey mapped and optimized', score: 10 },
    { value: 'understood', label: 'General understanding', score: 6 },
    { value: 'limited', label: 'Limited understanding', score: 3, is_gap: true },
    { value: 'none', label: 'No customer journey focus', score: 0, is_gap: true }
  ]);

  await insertQuestion('team_capabilities', {
    key: 'team_project_management',
    text: 'How are digital projects managed?',
    field_type: 'select',
    category: 'Process',
    order: 16
  }, [
    { value: 'formal', label: 'Formal PM methodology and tools', score: 10 },
    { value: 'tools', label: 'Project management tools used', score: 7 },
    { value: 'informal', label: 'Informal project tracking', score: 4, is_gap: true },
    { value: 'adhoc', label: 'Ad-hoc approach', score: 1, is_gap: true }
  ]);

  await insertQuestion('team_capabilities', {
    key: 'team_vendor_management',
    text: 'How well are digital vendors managed?',
    field_type: 'select',
    category: 'Vendors',
    order: 17
  }, [
    { value: 'strategic', label: 'Strategic vendor relationships', score: 10 },
    { value: 'managed', label: 'Well managed vendors', score: 7 },
    { value: 'basic', label: 'Basic vendor oversight', score: 4, is_gap: true },
    { value: 'poor', label: 'Poor vendor management', score: 1, is_gap: true }
  ]);

  await insertQuestion('team_capabilities', {
    key: 'team_knowledge_sharing',
    text: 'Is digital knowledge shared across the organization?',
    field_type: 'select',
    category: 'Knowledge',
    order: 18
  }, [
    { value: 'systematic', label: 'Systematic knowledge sharing', score: 10 },
    { value: 'regular', label: 'Regular training/updates', score: 7 },
    { value: 'occasional', label: 'Occasional sharing', score: 4, is_gap: true },
    { value: 'siloed', label: 'Knowledge siloed', score: 1, is_gap: true }
  ]);

  await insertQuestion('team_capabilities', {
    key: 'team_hiring_capability',
    text: 'Can the business attract digital talent?',
    field_type: 'select',
    category: 'Talent',
    order: 19
  }, [
    { value: 'strong', label: 'Strong employer brand for digital roles', score: 10 },
    { value: 'competitive', label: 'Competitive in market', score: 7 },
    { value: 'challenging', label: 'Challenging to attract talent', score: 3, is_gap: true },
    { value: 'difficult', label: 'Very difficult', score: 1, is_gap: true }
  ]);

  await insertQuestion('team_capabilities', {
    key: 'team_succession_planning',
    text: 'Is there succession planning for digital roles?',
    field_type: 'select',
    category: 'Continuity',
    order: 20
  }, [
    { value: 'documented', label: 'Yes, documented plan', score: 10 },
    { value: 'informal', label: 'Informal understanding', score: 5, is_gap: true },
    { value: 'none', label: 'No succession planning', score: 0, is_gap: true }
  ]);

  console.log('  ✓ Digital Team & Capabilities questions seeded (20)');

  // ============================================
  // ADDITIONAL WEBSITE QUESTIONS (5 new)
  // ============================================
  console.log('  Seeding additional Website questions...');

  await insertQuestion('website', {
    key: 'website_accessibility',
    text: 'Does the website meet accessibility standards (WCAG)?',
    field_type: 'select',
    category: 'Accessibility',
    quick_win: true,
    effort: 'medium',
    impact: 'medium',
    order: 16
  }, [
    { value: 'compliant', label: 'Yes, WCAG 2.1 compliant', score: 10 },
    { value: 'partial', label: 'Partially accessible', score: 5, is_gap: true },
    { value: 'no', label: 'Not accessible', score: 0, is_gap: true, quick_win_suggestion: 'Improve website accessibility' }
  ]);

  await insertQuestion('website', {
    key: 'website_core_web_vitals',
    text: 'Does the website pass Core Web Vitals?',
    description: 'Google performance metrics: LCP, FID, CLS',
    field_type: 'select',
    category: 'Performance',
    quick_win: true,
    effort: 'medium',
    impact: 'high',
    order: 17
  }, [
    { value: 'all_green', label: 'All metrics green', score: 10 },
    { value: 'mostly', label: 'Most metrics pass', score: 7 },
    { value: 'some', label: 'Some issues', score: 4, is_gap: true },
    { value: 'fail', label: 'Failing Core Web Vitals', score: 0, is_gap: true, quick_win_suggestion: 'Optimize Core Web Vitals' }
  ]);

  await insertQuestion('website', {
    key: 'website_multilingual',
    text: 'Is the website available in multiple languages?',
    field_type: 'select',
    category: 'Localization',
    order: 18
  }, [
    { value: 'multiple', label: 'Yes, multiple languages', score: 10 },
    { value: 'two', label: 'Two languages', score: 7 },
    { value: 'planned', label: 'Planning multilingual', score: 3 },
    { value: 'single', label: 'Single language only', score: 2 },
    { value: 'na', label: 'Not needed', score: 8 }
  ]);

  await insertQuestion('website', {
    key: 'website_chat_support',
    text: 'Is live chat or chatbot available on the website?',
    field_type: 'select',
    category: 'Support',
    quick_win: true,
    effort: 'low',
    impact: 'medium',
    order: 19
  }, [
    { value: 'both', label: 'Live chat + AI chatbot', score: 10 },
    { value: 'live', label: 'Live chat only', score: 8 },
    { value: 'chatbot', label: 'Chatbot only', score: 6 },
    { value: 'none', label: 'No chat support', score: 2, is_gap: true, quick_win_suggestion: 'Add website chat functionality' }
  ]);

  await insertQuestion('website', {
    key: 'website_personalization',
    text: 'Is website content personalized for visitors?',
    field_type: 'select',
    category: 'Personalization',
    order: 20
  }, [
    { value: 'ai', label: 'AI-driven personalization', score: 10 },
    { value: 'segments', label: 'Segment-based personalization', score: 7 },
    { value: 'basic', label: 'Basic (name, returning visitor)', score: 4 },
    { value: 'none', label: 'No personalization', score: 0 }
  ]);

  console.log('  ✓ Additional Website questions seeded (5)');

  // ============================================
  // ADDITIONAL SOCIAL MEDIA QUESTIONS (5 new)
  // ============================================
  console.log('  Seeding additional Social Media questions...');

  await insertQuestion('social_media', {
    key: 'social_tiktok',
    text: 'Does the business have a TikTok presence?',
    field_type: 'select',
    category: 'Presence',
    order: 11
  }, [
    { value: 'active', label: 'Yes, actively creating content', score: 10 },
    { value: 'present', label: 'Yes, but limited activity', score: 5 },
    { value: 'no', label: 'No TikTok presence', score: 0 },
    { value: 'na', label: 'Not relevant for audience', score: 7 }
  ]);

  await insertQuestion('social_media', {
    key: 'social_youtube',
    text: 'Does the business have a YouTube channel?',
    field_type: 'select',
    category: 'Video',
    order: 12
  }, [
    { value: 'active', label: 'Yes, regular uploads', score: 10 },
    { value: 'inactive', label: 'Yes, but inactive', score: 4, is_gap: true },
    { value: 'no', label: 'No YouTube channel', score: 0 }
  ]);

  await insertQuestion('social_media', {
    key: 'social_influencer_partnerships',
    text: 'Does the business work with influencers?',
    field_type: 'select',
    category: 'Partnerships',
    order: 13
  }, [
    { value: 'regular', label: 'Yes, ongoing partnerships', score: 10 },
    { value: 'occasional', label: 'Occasional collaborations', score: 6 },
    { value: 'planned', label: 'Planning to start', score: 3 },
    { value: 'no', label: 'No influencer work', score: 0 }
  ]);

  await insertQuestion('social_media', {
    key: 'social_community_management',
    text: 'Is there active community management?',
    field_type: 'select',
    category: 'Community',
    order: 14
  }, [
    { value: 'dedicated', label: 'Yes, dedicated community manager', score: 10 },
    { value: 'regular', label: 'Regular monitoring and engagement', score: 7 },
    { value: 'occasional', label: 'Occasional engagement', score: 4, is_gap: true },
    { value: 'none', label: 'No community management', score: 0, is_gap: true }
  ]);

  await insertQuestion('social_media', {
    key: 'social_crisis_plan',
    text: 'Is there a social media crisis management plan?',
    field_type: 'select',
    category: 'Risk',
    order: 15
  }, [
    { value: 'documented', label: 'Yes, documented plan', score: 10 },
    { value: 'informal', label: 'Informal guidelines', score: 5, is_gap: true },
    { value: 'none', label: 'No crisis plan', score: 0, is_gap: true, quick_win_suggestion: 'Create social media crisis plan' }
  ]);

  console.log('  ✓ Additional Social Media questions seeded (5)');

  // ============================================
  // ADDITIONAL SEO QUESTIONS (5 new)
  // ============================================
  console.log('  Seeding additional SEO questions...');

  await insertQuestion('seo', {
    key: 'seo_page_speed',
    text: 'What is the average page load time?',
    field_type: 'select',
    category: 'Technical',
    quick_win: true,
    effort: 'medium',
    impact: 'high',
    order: 11
  }, [
    { value: 'fast', label: 'Under 2 seconds', score: 10 },
    { value: 'good', label: '2-3 seconds', score: 7 },
    { value: 'slow', label: '3-5 seconds', score: 4, is_gap: true },
    { value: 'very_slow', label: 'Over 5 seconds', score: 1, is_gap: true, quick_win_suggestion: 'Improve page load speed' }
  ]);

  await insertQuestion('seo', {
    key: 'seo_content_freshness',
    text: 'How fresh is the website content for SEO?',
    field_type: 'select',
    category: 'Content',
    quick_win: true,
    effort: 'low',
    impact: 'medium',
    order: 12
  }, [
    { value: 'weekly', label: 'Updated weekly', score: 10 },
    { value: 'monthly', label: 'Updated monthly', score: 7 },
    { value: 'quarterly', label: 'Updated quarterly', score: 4, is_gap: true },
    { value: 'rarely', label: 'Rarely updated', score: 1, is_gap: true, quick_win_suggestion: 'Add fresh content regularly' }
  ]);

  await insertQuestion('seo', {
    key: 'seo_internal_linking',
    text: 'Is internal linking optimized?',
    field_type: 'select',
    category: 'On-Page',
    quick_win: true,
    effort: 'low',
    impact: 'medium',
    order: 13
  }, [
    { value: 'optimized', label: 'Yes, strategic internal linking', score: 10 },
    { value: 'basic', label: 'Basic linking present', score: 5, is_gap: true },
    { value: 'poor', label: 'Poor or no internal linking', score: 0, is_gap: true, quick_win_suggestion: 'Improve internal linking structure' }
  ]);

  await insertQuestion('seo', {
    key: 'seo_image_optimization',
    text: 'Are images optimized for SEO?',
    description: 'Alt tags, compression, file names',
    field_type: 'select',
    category: 'On-Page',
    quick_win: true,
    effort: 'low',
    impact: 'medium',
    order: 14
  }, yesNoPartialOptions);

  await insertQuestion('seo', {
    key: 'seo_competitor_gap',
    text: 'Has competitive SEO analysis been done?',
    field_type: 'select',
    category: 'Research',
    order: 15
  }, [
    { value: 'regular', label: 'Yes, regular competitive analysis', score: 10 },
    { value: 'once', label: 'Done once', score: 5, is_gap: true },
    { value: 'no', label: 'No competitive analysis', score: 0, is_gap: true }
  ]);

  console.log('  ✓ Additional SEO questions seeded (5)');

  // ============================================
  // ADDITIONAL CRM QUESTIONS (5 new)
  // ============================================
  console.log('  Seeding additional CRM & Automation questions...');

  await insertQuestion('crm_automation', {
    key: 'crm_segmentation',
    text: 'Is customer segmentation implemented?',
    field_type: 'select',
    category: 'Segmentation',
    order: 6
  }, [
    { value: 'advanced', label: 'Advanced behavioral segmentation', score: 10 },
    { value: 'basic', label: 'Basic demographic segmentation', score: 5, is_gap: true },
    { value: 'none', label: 'No segmentation', score: 0, is_gap: true, quick_win_suggestion: 'Implement customer segmentation' }
  ]);

  await insertQuestion('crm_automation', {
    key: 'crm_lifecycle_marketing',
    text: 'Is lifecycle email marketing implemented?',
    description: 'Welcome series, onboarding, win-back campaigns',
    field_type: 'select',
    category: 'Lifecycle',
    quick_win: true,
    effort: 'medium',
    impact: 'high',
    order: 7
  }, [
    { value: 'comprehensive', label: 'Yes, full lifecycle campaigns', score: 10 },
    { value: 'partial', label: 'Some lifecycle emails', score: 5, is_gap: true },
    { value: 'none', label: 'No lifecycle marketing', score: 0, is_gap: true, quick_win_suggestion: 'Create automated email sequences' }
  ]);

  await insertQuestion('crm_automation', {
    key: 'crm_sales_integration',
    text: 'Is CRM integrated with sales processes?',
    field_type: 'select',
    category: 'Sales',
    order: 8
  }, [
    { value: 'full', label: 'Fully integrated with pipeline', score: 10 },
    { value: 'partial', label: 'Partially integrated', score: 5, is_gap: true },
    { value: 'none', label: 'No sales integration', score: 0, is_gap: true }
  ]);

  await insertQuestion('crm_automation', {
    key: 'crm_customer_360',
    text: 'Is there a 360-degree customer view?',
    description: 'All customer interactions in one place',
    field_type: 'select',
    category: 'Data',
    order: 9
  }, [
    { value: 'unified', label: 'Yes, unified customer view', score: 10 },
    { value: 'partial', label: 'Partial visibility', score: 5, is_gap: true },
    { value: 'fragmented', label: 'Fragmented data', score: 0, is_gap: true }
  ]);

  await insertQuestion('crm_automation', {
    key: 'crm_sms_marketing',
    text: 'Is SMS marketing utilized?',
    field_type: 'select',
    category: 'Channels',
    order: 10
  }, [
    { value: 'integrated', label: 'Yes, integrated with CRM', score: 10 },
    { value: 'standalone', label: 'Yes, standalone tool', score: 6 },
    { value: 'planned', label: 'Planning to implement', score: 3 },
    { value: 'no', label: 'No SMS marketing', score: 0 }
  ]);

  console.log('  ✓ Additional CRM & Automation questions seeded (5)');

  // ============================================
  // ADDITIONAL ANALYTICS QUESTIONS (5 new)
  // ============================================
  console.log('  Seeding additional Analytics questions...');

  await insertQuestion('analytics_data', {
    key: 'analytics_attribution_model',
    text: 'What attribution model is used?',
    field_type: 'select',
    category: 'Attribution',
    order: 6
  }, [
    { value: 'data_driven', label: 'Data-driven attribution', score: 10 },
    { value: 'multi_touch', label: 'Multi-touch attribution', score: 8 },
    { value: 'last_click', label: 'Last-click attribution', score: 4, is_gap: true },
    { value: 'none', label: 'No attribution model', score: 0, is_gap: true }
  ]);

  await insertQuestion('analytics_data', {
    key: 'analytics_dashboard',
    text: 'Is there a marketing dashboard?',
    field_type: 'select',
    category: 'Visualization',
    quick_win: true,
    effort: 'medium',
    impact: 'high',
    order: 7
  }, [
    { value: 'custom', label: 'Yes, custom real-time dashboard', score: 10 },
    { value: 'standard', label: 'Yes, standard platform dashboards', score: 6 },
    { value: 'manual', label: 'Manual spreadsheet reports', score: 3, is_gap: true },
    { value: 'none', label: 'No dashboard', score: 0, is_gap: true, quick_win_suggestion: 'Create marketing dashboard' }
  ]);

  await insertQuestion('analytics_data', {
    key: 'analytics_customer_ltv',
    text: 'Is Customer Lifetime Value (LTV) tracked?',
    field_type: 'select',
    category: 'Metrics',
    order: 8
  }, [
    { value: 'calculated', label: 'Yes, calculated and used for decisions', score: 10 },
    { value: 'estimated', label: 'Estimated/basic calculation', score: 5, is_gap: true },
    { value: 'no', label: 'Not tracked', score: 0, is_gap: true, quick_win_suggestion: 'Calculate customer LTV' }
  ]);

  await insertQuestion('analytics_data', {
    key: 'analytics_ab_testing',
    text: 'Is A/B testing conducted?',
    field_type: 'select',
    category: 'Testing',
    order: 9
  }, [
    { value: 'continuous', label: 'Continuous testing program', score: 10 },
    { value: 'regular', label: 'Regular testing', score: 7 },
    { value: 'occasional', label: 'Occasional tests', score: 4, is_gap: true },
    { value: 'never', label: 'No A/B testing', score: 0, is_gap: true }
  ]);

  await insertQuestion('analytics_data', {
    key: 'analytics_roi_measurement',
    text: 'Is marketing ROI measured?',
    field_type: 'select',
    category: 'ROI',
    quick_win: true,
    effort: 'medium',
    impact: 'high',
    order: 10
  }, [
    { value: 'channel', label: 'Yes, by channel and campaign', score: 10 },
    { value: 'overall', label: 'Yes, overall marketing ROI', score: 6 },
    { value: 'partial', label: 'Partially measured', score: 3, is_gap: true },
    { value: 'no', label: 'Not measured', score: 0, is_gap: true, quick_win_suggestion: 'Implement ROI tracking' }
  ]);

  console.log('  ✓ Additional Analytics questions seeded (5)');

  // ============================================
  // ADDITIONAL REPUTATION QUESTIONS (5 new)
  // ============================================
  console.log('  Seeding additional Online Reputation questions...');

  await insertQuestion('reputation', {
    key: 'reputation_review_generation',
    text: 'Is there an active review generation program?',
    field_type: 'select',
    category: 'Generation',
    quick_win: true,
    effort: 'low',
    impact: 'high',
    order: 6
  }, [
    { value: 'automated', label: 'Yes, automated review requests', score: 10 },
    { value: 'manual', label: 'Manual follow-up for reviews', score: 6 },
    { value: 'none', label: 'No active program', score: 0, is_gap: true, quick_win_suggestion: 'Implement review generation program' }
  ]);

  await insertQuestion('reputation', {
    key: 'reputation_multiple_platforms',
    text: 'Are reviews managed across multiple platforms?',
    description: 'Google, Yelp, Facebook, industry-specific',
    field_type: 'select',
    category: 'Platforms',
    order: 7
  }, [
    { value: 'all', label: 'Yes, all relevant platforms', score: 10 },
    { value: 'some', label: 'Some platforms', score: 6, is_gap: true },
    { value: 'google_only', label: 'Google only', score: 4, is_gap: true },
    { value: 'none', label: 'No platform management', score: 0, is_gap: true }
  ]);

  await insertQuestion('reputation', {
    key: 'reputation_testimonial_collection',
    text: 'Are video testimonials collected?',
    field_type: 'select',
    category: 'Testimonials',
    order: 8
  }, [
    { value: 'regular', label: 'Yes, regularly collected', score: 10 },
    { value: 'some', label: 'A few video testimonials', score: 6 },
    { value: 'none', label: 'No video testimonials', score: 0, is_gap: true }
  ]);

  await insertQuestion('reputation', {
    key: 'reputation_brand_monitoring',
    text: 'Is brand mention monitoring in place?',
    field_type: 'select',
    category: 'Monitoring',
    order: 9
  }, [
    { value: 'realtime', label: 'Yes, real-time monitoring', score: 10 },
    { value: 'regular', label: 'Regular monitoring', score: 7 },
    { value: 'occasional', label: 'Occasional checking', score: 3, is_gap: true },
    { value: 'none', label: 'No brand monitoring', score: 0, is_gap: true }
  ]);

  await insertQuestion('reputation', {
    key: 'reputation_nps_tracking',
    text: 'Is Net Promoter Score (NPS) tracked?',
    field_type: 'select',
    category: 'Metrics',
    order: 10
  }, [
    { value: 'tracked', label: 'Yes, regularly tracked', score: 10 },
    { value: 'occasional', label: 'Measured occasionally', score: 5, is_gap: true },
    { value: 'no', label: 'Not tracked', score: 0, is_gap: true }
  ]);

  console.log('  ✓ Additional Online Reputation questions seeded (5)');

  // ============================================
  // ADDITIONAL SECURITY QUESTIONS (5 new)
  // ============================================
  console.log('  Seeding additional Security & Compliance questions...');

  await insertQuestion('security_compliance', {
    key: 'security_gdpr_compliance',
    text: 'Is the business GDPR/privacy regulation compliant?',
    field_type: 'select',
    category: 'Privacy',
    order: 6
  }, [
    { value: 'certified', label: 'Yes, certified compliant', score: 10 },
    { value: 'compliant', label: 'Yes, self-assessed compliant', score: 7 },
    { value: 'partial', label: 'Partially compliant', score: 4, is_gap: true },
    { value: 'unknown', label: 'Unknown/Not assessed', score: 1, is_gap: true },
    { value: 'na', label: 'Not applicable', score: 7 }
  ]);

  await insertQuestion('security_compliance', {
    key: 'security_pci_compliance',
    text: 'Is PCI DSS compliance maintained? (If applicable)',
    field_type: 'select',
    category: 'Payment Security',
    order: 7
  }, [
    { value: 'certified', label: 'Yes, PCI certified', score: 10 },
    { value: 'compliant', label: 'Compliant via payment processor', score: 8 },
    { value: 'partial', label: 'Partially compliant', score: 4, is_gap: true },
    { value: 'na', label: 'Not applicable (no payments)', score: 8 }
  ]);

  await insertQuestion('security_compliance', {
    key: 'security_employee_training',
    text: 'Do employees receive security awareness training?',
    field_type: 'select',
    category: 'Training',
    order: 8
  }, [
    { value: 'regular', label: 'Yes, regular training', score: 10 },
    { value: 'onboarding', label: 'Onboarding only', score: 5, is_gap: true },
    { value: 'none', label: 'No security training', score: 0, is_gap: true, quick_win_suggestion: 'Implement security awareness training' }
  ]);

  await insertQuestion('security_compliance', {
    key: 'security_vulnerability_scanning',
    text: 'Is regular vulnerability scanning conducted?',
    field_type: 'select',
    category: 'Security Testing',
    order: 9
  }, [
    { value: 'automated', label: 'Yes, automated continuous scanning', score: 10 },
    { value: 'regular', label: 'Regular manual scans', score: 7 },
    { value: 'occasional', label: 'Occasional scanning', score: 4, is_gap: true },
    { value: 'never', label: 'No scanning', score: 0, is_gap: true }
  ]);

  await insertQuestion('security_compliance', {
    key: 'security_incident_response',
    text: 'Is there an incident response plan?',
    field_type: 'select',
    category: 'Response',
    order: 10
  }, [
    { value: 'tested', label: 'Yes, documented and tested', score: 10 },
    { value: 'documented', label: 'Yes, documented', score: 7 },
    { value: 'informal', label: 'Informal plan', score: 3, is_gap: true },
    { value: 'none', label: 'No incident response plan', score: 0, is_gap: true, quick_win_suggestion: 'Create incident response plan' }
  ]);

  console.log('  ✓ Additional Security & Compliance questions seeded (5)');

  console.log('\n✅ Comprehensive assessment questions seeded successfully!');
  console.log('Summary:');
  console.log('  ✓ Digital Advertising: 20 questions');
  console.log('  ✓ E-Commerce: 20 questions');
  console.log('  ✓ Content Strategy: 20 questions');
  console.log('  ✓ Technology Stack: 20 questions');
  console.log('  ✓ Digital Team & Capabilities: 20 questions');
  console.log('  ✓ Website: 5 additional questions');
  console.log('  ✓ Social Media: 5 additional questions');
  console.log('  ✓ SEO: 5 additional questions');
  console.log('  ✓ CRM & Automation: 5 additional questions');
  console.log('  ✓ Analytics & Data: 5 additional questions');
  console.log('  ✓ Online Reputation: 5 additional questions');
  console.log('  ✓ Security & Compliance: 5 additional questions');
  console.log('  Total: 130 new questions seeded');
};

exports.down = async (db, run, get, all) => {
  console.log('⬇️  Removing comprehensive assessment questions...');

  // Get all question keys from this migration
  const questionKeys = [
    // Digital Advertising
    'ads_google_ads_active', 'ads_facebook_meta_ads', 'ads_linkedin_ads', 'ads_retargeting',
    'ads_budget_monthly', 'ads_roas_tracking', 'ads_conversion_tracking', 'ads_landing_pages',
    'ads_audience_targeting', 'ads_creative_testing', 'ads_negative_keywords', 'ads_quality_score',
    'ads_bid_strategy', 'ads_display_network', 'ads_video_advertising', 'ads_local_campaigns',
    'ads_competitor_monitoring', 'ads_attribution_model', 'ads_management', 'ads_reporting_frequency',
    // E-Commerce
    'ecom_platform', 'ecom_online_sales_percentage', 'ecom_payment_options', 'ecom_mobile_experience',
    'ecom_checkout_process', 'ecom_cart_abandonment', 'ecom_product_descriptions', 'ecom_product_images',
    'ecom_product_reviews', 'ecom_inventory_management', 'ecom_shipping_options', 'ecom_order_tracking',
    'ecom_search_functionality', 'ecom_personalization', 'ecom_marketplace_presence', 'ecom_return_policy',
    'ecom_upsell_crosssell', 'ecom_subscription_model', 'ecom_live_chat', 'ecom_conversion_rate',
    // Content Strategy
    'content_strategy_exists', 'content_calendar', 'content_blog_frequency', 'content_quality_rating',
    'content_types_variety', 'content_video_presence', 'content_seo_optimization', 'content_buyer_journey',
    'content_repurposing', 'content_email_newsletters', 'content_user_generated', 'content_thought_leadership',
    'content_gated_content', 'content_evergreen_updating', 'content_competitor_analysis', 'content_brand_voice',
    'content_performance_tracking', 'content_internal_resources', 'content_case_studies', 'content_distribution',
    // Technology Stack
    'tech_website_platform', 'tech_hosting_quality', 'tech_integrations_count', 'tech_api_capabilities',
    'tech_automation_tools', 'tech_data_warehouse', 'tech_mobile_app', 'tech_single_sign_on',
    'tech_cloud_services', 'tech_documentation', 'tech_disaster_recovery', 'tech_uptime_monitoring',
    'tech_dev_practices', 'tech_scalability', 'tech_vendor_dependency', 'tech_legacy_systems',
    'tech_ai_ml_usage', 'tech_payment_processing', 'tech_communication_tools', 'tech_refresh_cycle',
    // Digital Team & Capabilities
    'team_digital_roles', 'team_size', 'team_skills_assessment', 'team_training_budget',
    'team_certifications', 'team_agency_support', 'team_data_literacy', 'team_content_creation',
    'team_technical_skills', 'team_executive_buy_in', 'team_digital_maturity', 'team_innovation_culture',
    'team_collaboration_tools', 'team_remote_capability', 'team_customer_journey_understanding',
    'team_project_management', 'team_vendor_management', 'team_knowledge_sharing', 'team_hiring_capability',
    'team_succession_planning',
    // Additional Website
    'website_accessibility', 'website_core_web_vitals', 'website_multilingual', 'website_chat_support',
    'website_personalization',
    // Additional Social Media
    'social_tiktok', 'social_youtube', 'social_influencer_partnerships', 'social_community_management',
    'social_crisis_plan',
    // Additional SEO
    'seo_page_speed', 'seo_content_freshness', 'seo_internal_linking', 'seo_image_optimization',
    'seo_competitor_gap',
    // Additional CRM
    'crm_segmentation', 'crm_lifecycle_marketing', 'crm_sales_integration', 'crm_customer_360',
    'crm_sms_marketing',
    // Additional Analytics
    'analytics_attribution_model', 'analytics_dashboard', 'analytics_customer_ltv', 'analytics_ab_testing',
    'analytics_roi_measurement',
    // Additional Reputation
    'reputation_review_generation', 'reputation_multiple_platforms', 'reputation_testimonial_collection',
    'reputation_brand_monitoring', 'reputation_nps_tracking',
    // Additional Security
    'security_gdpr_compliance', 'security_pci_compliance', 'security_employee_training',
    'security_vulnerability_scanning', 'security_incident_response'
  ];

  for (const key of questionKeys) {
    try {
      const question = await get('SELECT id FROM assessment_questions WHERE question_key = ?', [key]);
      if (question) {
        await run('DELETE FROM assessment_question_options WHERE question_id = ?', [question.id]);
        await run('DELETE FROM assessment_questions WHERE id = ?', [question.id]);
      }
    } catch (err) {
      console.log(`  ⚠️  Could not remove ${key}: ${err.message}`);
    }
  }

  console.log('✅ Comprehensive questions removed');
};
