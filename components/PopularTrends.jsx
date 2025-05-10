"use client";
import React from "react";
import css from "@/styles/PopularTrends.module.css";
import { Alert, Avatar, Flex, Typography } from "antd";
import { mockTrends } from "@/mock/mockTrends";
import Iconify from "./Iconify";
import { getPopularTrends } from "@/actions/post";
import { useQuery } from "@tanstack/react-query";
import SearchButton from "./SearchButton";

const PopularTrends = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["trends"],
    queryFn: getPopularTrends,
    staleTime: 1000 * 60 * 60 * 24, // 1 day
  });

  if (error) {
    return (
      <Alert
        message="Error"
        description="Unable to fetch popular trends"
        type="error"
        showIcon
      />
    );
  }

  if (isLoading) {
    return (
      <div className={css.wrapper}>
        <div className={css.bg} />
        <div className={css.container}>
          <Flex vertical>
            <Typography className="typoSubtitle2">TOP TRENDING</Typography>
            <Typography className="typoH4">#Popular Trends</Typography>
          </Flex>
          <Flex vertical gap={15}>
            {[1, 2, 3].map((i) => (
              <Flex key={i} gap={"1rem"} align="center">
                <Avatar style={{ background: "#FF990047" }} />
                <Flex vertical>
                  <Typography className="typoSubtitle1" style={{ fontWeight: "bold" }}>
                    Loading...
                  </Typography>
                  <Typography className="typoCaption" style={{ fontWeight: "bold", color: "gray" }}>
                    Loading...
                  </Typography>
                </Flex>
              </Flex>
            ))}
          </Flex>
        </div>
      </div>
    );
  }

  return (
    <div className={css.wrapper}>
      <div className={css.bg} />
      <SearchButton />
      {/* head */}
      <div className={css.container}>
        <Flex vertical>
          <Typography className="typoSubtitle2">TOP TRENDING</Typography>
          <Typography className="typoH4">#Popular Trends</Typography>
        </Flex>
        <Flex vertical gap={15}>
          {data?.data?.map((trend, i) => (
            <Flex key={i} gap={"1rem"} align="center">
              {/* trend icon */}
              <Avatar
                style={{ background: "#FF990047" }}
                icon={
                  <Iconify
                    icon="mingcute:hashtag-fill"
                    color="var(--primary)"
                    width="18px"
                  />
                }
              />
              {/* trend info */}
              <Flex vertical>
                <Typography
                  className="typoSubtitle1"
                  style={{ fontWeight: "bold" }}
                >
                  {trend.name}
                </Typography>
                <Typography
                  className="typoCaption"
                  style={{ fontWeight: "bold", color: "gray" }}
                >
                  {trend?._count?.name} Posts
                </Typography>
              </Flex>
            </Flex>
          ))}
        </Flex>
      </div>
    </div>
  );
};

export default PopularTrends;
