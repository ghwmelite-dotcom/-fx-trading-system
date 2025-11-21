/**
 * Broker Comparison API Routes
 */

import {
  calculateBrokerCosts,
  calculateCurrentBrokerCosts,
  calculatePotentialSavings,
  calculateAllBrokerCosts
} from './costCalculator.js';

import {
  getPersonalizedRecommendation,
  compareBrokers,
  checkSavingsOpportunity
} from './recommendationEngine.js';

import {
  getAllBrokers,
  getBrokerById,
  linkUserBroker,
  getUserBrokers,
  setPrimaryBroker,
  submitBrokerReview,
  getBrokerReviews,
  voteOnReview,
  trackAffiliateClick,
  searchBrokers,
  getPopularBrokers
} from './brokerService.js';

/**
 * Register all broker comparison routes
 */
export function registerBrokerRoutes(routes) {
  // Get all brokers
  routes.push({
    method: 'GET',
    pattern: /^\/api\/brokers$/,
    handler: async (request, env, userId) => {
      try {
        const url = new URL(request.url);

        const filters = {
          regulated: url.searchParams.get('regulated') === 'true' ? true :
                     url.searchParams.get('regulated') === 'false' ? false : undefined,
          minRating: url.searchParams.get('minRating')
            ? parseFloat(url.searchParams.get('minRating'))
            : undefined,
          maxSpread: url.searchParams.get('maxSpread')
            ? parseFloat(url.searchParams.get('maxSpread'))
            : undefined,
          platform: url.searchParams.get('platform') || undefined,
          country: url.searchParams.get('country') || undefined
        };

        const brokers = await getAllBrokers(filters, env);

        return new Response(JSON.stringify({
          success: true,
          brokers,
          count: brokers.length
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch brokers',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Get broker by ID
  routes.push({
    method: 'GET',
    pattern: /^\/api\/brokers\/(\d+)$/,
    handler: async (request, env, userId, matches) => {
      try {
        const brokerId = parseInt(matches[1]);
        const broker = await getBrokerById(brokerId, env);

        if (!broker) {
          return new Response(JSON.stringify({
            error: 'Broker not found'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          broker
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch broker',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Compare brokers
  routes.push({
    method: 'POST',
    pattern: /^\/api\/brokers\/compare$/,
    handler: async (request, env, userId) => {
      try {
        const body = await request.json();

        if (!body.brokerIds || !Array.isArray(body.brokerIds) || body.brokerIds.length < 2) {
          return new Response(JSON.stringify({
            error: 'Please provide at least 2 broker IDs to compare'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const result = await compareBrokers(userId, body.brokerIds, env);

        return new Response(JSON.stringify({
          success: true,
          ...result
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to compare brokers',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Get my broker costs
  routes.push({
    method: 'GET',
    pattern: /^\/api\/brokers\/my-costs$/,
    handler: async (request, env, userId) => {
      try {
        const url = new URL(request.url);

        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dateRange = {
          start: url.searchParams.get('start') || thirtyDaysAgo.toISOString().split('T')[0],
          end: url.searchParams.get('end') || today.toISOString().split('T')[0]
        };

        const result = await calculateCurrentBrokerCosts(userId, dateRange, env);

        return new Response(JSON.stringify({
          success: true,
          ...result
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to calculate costs',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Calculate costs for specific broker
  routes.push({
    method: 'GET',
    pattern: /^\/api\/brokers\/(\d+)\/costs$/,
    handler: async (request, env, userId, matches) => {
      try {
        const brokerId = parseInt(matches[1]);
        const url = new URL(request.url);

        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dateRange = {
          start: url.searchParams.get('start') || thirtyDaysAgo.toISOString().split('T')[0],
          end: url.searchParams.get('end') || today.toISOString().split('T')[0]
        };

        const result = await calculateBrokerCosts(userId, brokerId, dateRange, env);

        return new Response(JSON.stringify({
          success: true,
          ...result
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to calculate broker costs',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Calculate potential savings
  routes.push({
    method: 'POST',
    pattern: /^\/api\/brokers\/potential-savings$/,
    handler: async (request, env, userId) => {
      try {
        const body = await request.json();

        if (!body.currentBrokerId || !body.targetBrokerId) {
          return new Response(JSON.stringify({
            error: 'Please provide currentBrokerId and targetBrokerId'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dateRange = body.dateRange || {
          start: thirtyDaysAgo.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };

        const result = await calculatePotentialSavings(
          userId,
          body.currentBrokerId,
          body.targetBrokerId,
          dateRange,
          env
        );

        return new Response(JSON.stringify({
          success: true,
          ...result
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to calculate potential savings',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Get personalized recommendation
  routes.push({
    method: 'GET',
    pattern: /^\/api\/brokers\/recommendations$/,
    handler: async (request, env, userId) => {
      try {
        const url = new URL(request.url);

        const preferences = {
          prioritizeCost: url.searchParams.get('prioritizeCost') === 'true',
          prioritizeExecution: url.searchParams.get('prioritizeExecution') === 'true',
          prioritizeRegulation: url.searchParams.get('prioritizeRegulation') === 'true'
        };

        const result = await getPersonalizedRecommendation(userId, preferences, env);

        if (result.error) {
          return new Response(JSON.stringify({
            success: false,
            error: result.error
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          ...result
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to get recommendations',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Submit broker review
  routes.push({
    method: 'POST',
    pattern: /^\/api\/brokers\/(\d+)\/reviews$/,
    handler: async (request, env, userId, matches) => {
      try {
        const brokerId = parseInt(matches[1]);
        const body = await request.json();

        if (!body.rating || !body.reviewText) {
          return new Response(JSON.stringify({
            error: 'Rating and review text are required'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (body.rating < 1 || body.rating > 5) {
          return new Response(JSON.stringify({
            error: 'Rating must be between 1 and 5'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const result = await submitBrokerReview(userId, brokerId, body, env);

        if (result.error) {
          return new Response(JSON.stringify({
            success: false,
            ...result
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          ...result,
          message: 'Review submitted successfully'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to submit review',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Get broker reviews
  routes.push({
    method: 'GET',
    pattern: /^\/api\/brokers\/(\d+)\/reviews$/,
    handler: async (request, env, userId, matches) => {
      try {
        const brokerId = parseInt(matches[1]);
        const url = new URL(request.url);

        const options = {
          limit: parseInt(url.searchParams.get('limit')) || 20,
          offset: parseInt(url.searchParams.get('offset')) || 0
        };

        const result = await getBrokerReviews(brokerId, options, env);

        return new Response(JSON.stringify({
          success: true,
          ...result
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch reviews',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Vote on review
  routes.push({
    method: 'POST',
    pattern: /^\/api\/brokers\/reviews\/(\d+)\/vote$/,
    handler: async (request, env, userId, matches) => {
      try {
        const reviewId = parseInt(matches[1]);
        const body = await request.json();

        await voteOnReview(userId, reviewId, body.helpful, env);

        return new Response(JSON.stringify({
          success: true,
          message: 'Vote recorded'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to record vote',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Link user broker
  routes.push({
    method: 'POST',
    pattern: /^\/api\/brokers\/(\d+)\/link$/,
    handler: async (request, env, userId, matches) => {
      try {
        const brokerId = parseInt(matches[1]);
        const body = await request.json();

        const result = await linkUserBroker(userId, brokerId, body, env);

        return new Response(JSON.stringify({
          success: true,
          ...result
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to link broker',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Get user's linked brokers
  routes.push({
    method: 'GET',
    pattern: /^\/api\/brokers\/my-brokers$/,
    handler: async (request, env, userId) => {
      try {
        const brokers = await getUserBrokers(userId, env);

        return new Response(JSON.stringify({
          success: true,
          brokers,
          count: brokers.length
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch linked brokers',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Set primary broker
  routes.push({
    method: 'POST',
    pattern: /^\/api\/brokers\/(\d+)\/set-primary$/,
    handler: async (request, env, userId, matches) => {
      try {
        const brokerId = parseInt(matches[1]);
        await setPrimaryBroker(userId, brokerId, env);

        return new Response(JSON.stringify({
          success: true,
          message: 'Primary broker updated'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to set primary broker',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Track affiliate click
  routes.push({
    method: 'POST',
    pattern: /^\/api\/brokers\/(\d+)\/affiliate-click$/,
    handler: async (request, env, userId, matches) => {
      try {
        const brokerId = parseInt(matches[1]);
        await trackAffiliateClick(userId, brokerId, env);

        return new Response(JSON.stringify({
          success: true
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to track click'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Search brokers
  routes.push({
    method: 'GET',
    pattern: /^\/api\/brokers\/search$/,
    handler: async (request, env, userId) => {
      try {
        const url = new URL(request.url);
        const query = url.searchParams.get('q') || '';
        const limit = parseInt(url.searchParams.get('limit')) || 10;

        const results = await searchBrokers(query, limit, env);

        return new Response(JSON.stringify({
          success: true,
          results,
          count: results.length
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Search failed',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Get popular brokers
  routes.push({
    method: 'GET',
    pattern: /^\/api\/brokers\/popular$/,
    handler: async (request, env, userId) => {
      try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit')) || 10;

        const brokers = await getPopularBrokers(limit, env);

        return new Response(JSON.stringify({
          success: true,
          brokers,
          count: brokers.length
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to fetch popular brokers',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });

  // Check for savings opportunity
  routes.push({
    method: 'GET',
    pattern: /^\/api\/brokers\/savings-opportunity$/,
    handler: async (request, env, userId) => {
      try {
        const result = await checkSavingsOpportunity(userId, env);

        return new Response(JSON.stringify({
          success: true,
          ...result
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Failed to check savings opportunity',
          details: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  });
}
