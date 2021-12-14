import { Button } from "antd";
import { Graph } from "react-d3-graph";
import React, { useState } from "react";
import { gql, useQuery } from "@apollo/client";

export default function TreeViz({ pyramidContract }) {
  // the graph configuration, just override the ones you need
  const myConfig = {
    nodeHighlightBehavior: true,
    node: {
      color: "lightgreen",
      size: 4000,
      highlightStrokeColor: "blue",
      labelProperty: "label",
      labelPosition: "center",
      symbolType: "circle",
    },
    link: {
      highlightColor: "lightblue",
    },
    d3: {
      linkLength: 1000,
      gravity: -500,
    },
    panAndZoom: true,
    directed: true,
  };
  const EXAMPLE_GRAPHQL = `
  {
    nodes {
        id
        donationAmount
        cumualativeDonationAmount
        createdAt
        parentNodeAddress    
        totalRewardAmount
        unclaimedRewardAmount
    }
  }
  `;
  const EXAMPLE_GQL = gql(EXAMPLE_GRAPHQL);
  const { loading, data } = useQuery(EXAMPLE_GQL, { pollInterval: 2500 });

  let processData = rawData => {
    if (!rawData) return undefined;
    let nodes = [];
    let links = [];

    rawData.nodes.forEach(node => {
      nodes.push({
        id: node.id,
        color: node.parentNodeAddress == "0x0000000000000000000000000000000000000000" ? "red" : "lightgreen",
        label: node.id.substring(0, 7) + " - " + node.donationAmount + " - " + node.totalRewardAmount,
        donationAmount: node.donationAmount,
        cumualativeDonationAmount: node.cumualativeDonationAmount,
        createdAt: node.createdAt,
        parentNodeAddress: node.parentNodeAddress,
        size: node.donationAmount,
        // viewGenerator: node => {
        //   return (
        //     <div>
        //       <p>{node.id}</p>
        //       <p>{node.donationAmount}</p>
        //       <p>{node.totalRewardAmount}</p>
        //     </div>
        //   );
        // }
      });
    });
    rawData.nodes.forEach(link => {
      if (link.parentNodeAddress != "0x0000000000000000000000000000000000000000") {
        links.push({
          source: link.parentNodeAddress,
          target: link.id,
        });
      }
    });
    return { nodes, links };
  };
  const graphData = processData(data);

  const onClickNode = node => {
    alert(node);
  };

  return (
    <div>
      {!loading ? (
        <Graph
          id="graph-id" // id is mandatory
          data={graphData}
          config={myConfig}
          onClickNode={node => onClickNode(node)}
          // onClickLink={onClickLink}
        />
      ) : (
        "Loading..."
      )}
    </div>
  );
}
