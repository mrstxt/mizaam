import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextCoreWebVitals,
  {
    rules: {
      // Uzbek matnlarida apostrof ko'p ishlatilgani uchun build/lintni to'xtatmasin.
      "react/no-unescaped-entities": "off",
      // Mavjud client sahifalarda data fetching useEffect ichida qilingan.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
