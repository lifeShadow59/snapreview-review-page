module.exports = {
  apps: [
    {
      name: "snapreview-review-page",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3002", // Change port if needed
      cwd: "/home/ubuntu/snapreview-review-page", // Update this path
      instances: 1, // or 'max' for all CPU cores
      exec_mode: "fork", // or 'cluster' for load-balancing
    },
  ],
};
