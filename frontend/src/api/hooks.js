import { useQuery, useMutation } from "@apollo/client";
import {
  GET_MY_POINTS,
  GET_POINT_HISTORY,
  GET_ACTIVE_PROMOTIONS,
  GET_MY_RATINGS,
  RATE_DISH,
  REDEEM_POINTS,
  CREATE_PROMOTION,
} from "./graphql.js";

// ─── LOYALTY ──────────────────────────────────────────────────────────────────

export function useMyPoints(customerId) {
  return useQuery(GET_MY_POINTS, {
    context: { headers: { "x-customer-id": customerId } },
    skip: !customerId,
  });
}

export function usePointHistory(customerId, limit = 20) {
  return useQuery(GET_POINT_HISTORY, {
    variables: { limit },
    context: { headers: { "x-customer-id": customerId } },
    skip: !customerId,
  });
}

export function useActivePromotions(customerId, restaurantId) {
  return useQuery(GET_ACTIVE_PROMOTIONS, {
    variables: { restaurantId },
    context: { headers: { "x-customer-id": customerId } },
    skip: !customerId,
  });
}

export function useRedeemPoints(customerId) {
  return useMutation(REDEEM_POINTS, {
    context: { headers: { "x-customer-id": customerId } },
  });
}

export function useCreatePromotion(customerId) {
  return useMutation(CREATE_PROMOTION, {
    context: { headers: { "x-customer-id": customerId } },
    refetchQueries: [GET_ACTIVE_PROMOTIONS],
  });
}

// ─── CUSTOMER ─────────────────────────────────────────────────────────────────

export function useMyRatings(customerId) {
  return useQuery(GET_MY_RATINGS, {
    context: { headers: { "x-customer-id": customerId } },
    skip: !customerId,
  });
}

export function useRateDish(customerId) {
  return useMutation(RATE_DISH, {
    context: { headers: { "x-customer-id": customerId } },
    refetchQueries: [GET_MY_RATINGS],
  });
}
