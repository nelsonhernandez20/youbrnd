"use client";
import React, { useState } from "react";
import { Button, Modal, Input, List, Avatar, Typography, Flex, Radio } from "antd";
import { Icon } from "@iconify/react";
import { searchUsers } from "@/actions/user";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import css from "@/styles/SearchModal.module.css";

const SearchButton = () => {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search", debouncedSearchTerm, searchType],
    queryFn: () => searchUsers({ query: debouncedSearchTerm, type: searchType }),
    enabled: debouncedSearchTerm.length > 0,
  });

  return (
    <>
      <Button
        type="primary"
        icon={<Icon icon="solar:magnifer-linear" width={20} />}
        onClick={() => setIsSearchModalOpen(true)}
        style={{ marginBottom: "1rem", width: "100%" }}
      >
        Search Users
      </Button>

      <Modal
        title={
          <div className={css.modalHeader}>
            <Typography.Title level={5}>Search Users</Typography.Title>
            <Radio.Group
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="all">All</Radio.Button>
              <Radio.Button value="influencer">Influencers</Radio.Button>
              <Radio.Button value="company">Companies</Radio.Button>
            </Radio.Group>
          </div>
        }
        open={isSearchModalOpen}
        onCancel={() => setIsSearchModalOpen(false)}
        footer={null}
        width={600}
        className={css.searchModal}
      >
        <div className={css.searchContainer}>
          <Input
            placeholder="Search by name, email, or bio..."
            prefix={<Icon icon="solar:magnifer-linear" width={20} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={css.searchInput}
            size="large"
          />

          <div className={css.resultsContainer}>
            {isLoading ? (
              <div className={css.loadingContainer}>
                <Typography.Text>Searching...</Typography.Text>
              </div>
            ) : searchResults?.data?.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={searchResults.data}
                renderItem={(user) => (
                  <List.Item className={css.resultItem}>
                    <Link href={`/profile/${user.id}`} onClick={() => setIsSearchModalOpen(false)}>
                      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                        <Avatar src={user.image_url} />
                        <div style={{ marginLeft: 12, width: "100%" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 500 }}>{user.first_name} {user.last_name}</span>
                            {user.isInfluencer && (
                              <Icon icon="fluent:star-24-filled" className={css.influencerIcon} />
                            )}
                            <span style={{ color: "#888" }}>@{user.username}</span>
                          </div>
                          {user.bio && (
                            <div style={{ fontSize: 13, color: "#666", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 350 }}>
                              {user.bio}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </List.Item>
                )}
              />
            ) : debouncedSearchTerm ? (
              <div className={css.noResults}>
                <Typography.Text>No users found</Typography.Text>
              </div>
            ) : null}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SearchButton; 