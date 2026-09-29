// import { defineConfig } from "vite";

// export default defineConfig({
//   server: {
//     proxy: {
//       "/api": {
//         target: "http://localhost:5094",
//         changeOrigin: true,
//         headers: { origin: "http://localhost:5094" },
//       },
//     },
//   },
// });

import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5094",
        changeOrigin: true,
      },
    },
  },
});