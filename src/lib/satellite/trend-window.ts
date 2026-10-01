// Osobny moduł bez zależności serwerowych — importuje go też komponent klienta.

/** Porównujemy NDVI tylko z odczytami z ostatnich N dni — dalej to zwykle inny etap
 *  sezonu albo wręcz inna uprawa (żniwa → siew), a „spadek" byłby fałszywym alarmem. */
export const TREND_WINDOW_DAYS = 45;
