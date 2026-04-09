import { useQuery, useMutation } from "@apollo/client";
import {
  GET_MY_POINTS,
  GET_POINT_HISTORY,
  GET_ACTIVE_PROMOTIONS,
  GET_MY_RATINGS,
  RATE_DISH,
  REDEEM_POINTS,
  CREATE_PROMOTION,
  GET_ALL_REWARDS // Añadida para la nueva funcionalidad
} from "./graphql.js";

// ─── LOYALTY ──────────────────────────────────────────────────────────────────

export function useMyPoints() {
  return useQuery(GET_MY_POINTS);
}

export function usePointHistory(limit = 20) {
  return useQuery(GET_POINT_HISTORY, {
    variables: { limit },
  });
}

export function useActivePromotions(restaurantId) {
  return useQuery(GET_ACTIVE_PROMOTIONS, {
    variables: { restaurantId },
  });
}

export function useAllRewards() {
  return useQuery(GET_ALL_REWARDS);
}

export function useRedeemPoints() {
  return useMutation(REDEEM_POINTS, {
    refetchQueries: [{ query: GET_MY_POINTS }, { query: GET_POINT_HISTORY }],
  });
}

export function useCreatePromotion() {
  return useMutation(CREATE_PROMOTION, {
    refetchQueries: [{ query: GET_ACTIVE_PROMOTIONS }],
  });
}

// ─── CUSTOMER ─────────────────────────────────────────────────────────────────

export function useMyRatings() {
  return useQuery(GET_MY_RATINGS);
}

export function useRateDish() {
  return useMutation(RATE_DISH, {
    refetchQueries: [{ query: GET_MY_RATINGS }, { query: GET_MY_POINTS }],
    // Refrescamos puntos porque calificar platos suele dar puntos en tu lógica
  });
}