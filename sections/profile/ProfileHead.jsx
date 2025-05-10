"use client";
import React, { useEffect, useRef, useState } from "react";
import css from "@/styles/ProfileHead.module.css";
import { Button, Flex, Image, Skeleton, Spin, Tabs, Input, Switch } from "antd";
import Box from "@/components/Box";
import { Typography } from "antd";
import { Icon } from "@iconify/react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUser, updateBanner, updateBio, updateInfluencerStatus } from "@/actions/user";
import toast from "react-hot-toast";
const { Text } = Typography;
const TABS = [
  {
    label: "Profile",
    icon: "solar:user-id-bold",
  },
  {
    label: "Followers",
    icon: "ph:heart-fill",
  },
  {
    label: "Followings",
    icon: "fluent:people-20-filled",
  },
];
const ProfileHead = ({
  userId,
  data,
  isLoading,
  isError,
  selectedTab,
  setSelectedTab,
}) => {
  const [bannerPreview, setBannerPreview] = useState(false);
  const { user } = useUser();
  const inputRef = useRef(null);
  const [banner, setBanner] = useState(null);
  const [bioText, setBioText] = useState("");
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: updateBanner,
    onSuccess: () => {
      toast.success("Banner updated successfully!");
    },
    onError: () => {
      toast.error("Something wrong happened. Try again!");
    },
  });

  const { mutate: updateBioMutation, isPending: isUpdatingBio } = useMutation({
    mutationFn: updateBio,
    onSuccess: () => {
      toast.success("Bio updated successfully!");
      queryClient.invalidateQueries(["user", userId]);
    },
    onError: () => {
      toast.error("Something wrong happened. Try again!");
    },
  });

  const { mutate: updateInfluencerMutation, isPending: isUpdatingInfluencer } = useMutation({
    mutationFn: updateInfluencerStatus,
    onSuccess: () => {
      toast.success("Profile type updated successfully!");
      queryClient.invalidateQueries(["user", userId]);
    },
    onError: () => {
      toast.error("Something wrong happened. Try again!");
    },
  });

  useEffect(() => {
    if (data?.data?.banner_url) {
      setBanner(data?.data?.banner_url);
    }
  }, [data, setBanner]);

  useEffect(() => {
    if (data?.data?.bio) {
      setBioText(data.data.bio);
    }
  }, [data?.data?.bio]);

  const handleBannerChange = async (e) => {
    const file = e.target.files[0];
    // put a limit of 5mb file size
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error("Image size is greater than 5 MB");
      return;
    }

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = () => {
        setBanner(reader.result);
        mutate({
          id: user?.id,
          banner: reader.result,
          prevBannerId: data?.data?.banner_id,
        });
      };
    }
  };

  if (isError) return <div>Error</div>;
  return (
    <div className={css.container}>
      <Spin spinning={isPending || isUpdatingBio || isUpdatingInfluencer}>
        <div className={css.banner} onClick={() => setBannerPreview(true)}>
          <Image
            src={banner || "/images/banner.png"}
            alt="banner"
            preview={{
              mask: null,
              visible: bannerPreview,
              onVisibleChange: (visible) => setBannerPreview(visible),
            }}
            width={"100%"}
            height={"15rem"}
          />

          {userId === user?.id && (
            <div
              className={css.editButton}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <input
                accept="image/*"
                multiple={false}
                ref={inputRef}
                onChange={(e) => handleBannerChange(e)}
                type="file"
                hidden
              />
              <Button
                onClick={() => inputRef.current.click()}
                type="primary"
                shape="circle"
                icon={
                  <Icon icon="fluent:image-edit-20-filled" width={"20px"} />
                }
              />
            </div>
          )}
        </div>
      </Spin>

      <Box>
        <div className={css.footer}>
          {/* left side */}
          <div className={css.left}>
            {/* profile */}
            <div className={css.profile}>
              <div className={css.profileImage}>
                <Image
                  src={
                    data?.data?.image_url || "/images/placeholder-avatar.png"
                  }
                  alt="profile"
                  preview={{ mask: null }}
                />
              </div>
              <div className={css.profileInfo}>
                {!isLoading ? (
                  <>
                    <Text className={"typoH6"}>
                      {data?.data?.first_name} {data?.data?.last_name}
                    </Text>
                    <Text className={"typoBody1"} type="secondary">
                      @{data?.data?.username}
                    </Text>
                    {/* Mostrar tags si existen */}
                    {Array.isArray(data?.data?.tags) && data.data.tags.length > 0 && (
                      <div style={{ margin: "0.5rem 0", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {data.data.tags.map((tag, idx) => (
                          <span key={idx} style={{
                            background: "#f0f0f0",
                            color: "#333",
                            borderRadius: "1rem",
                            padding: "0.2rem 0.8rem",
                            fontSize: 13,
                            fontWeight: 500,
                            display: "inline-block"
                          }}>{tag}</span>
                        ))}
                      </div>
                    )}
                    {userId === user?.id && (
                      <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Switch
                          checked={data?.data?.isInfluencer}
                          onChange={(checked) => {
                            updateInfluencerMutation({
                              id: user?.id,
                              isInfluencer: checked,
                            });
                          }}
                        />
                        <Text className={"typoBody2"}>
                          {data?.data?.isInfluencer ? "Influencer Account" : "company Account"}
                        </Text>
                      </div>
                    )}
                    {userId === user?.id ? (
                      <div style={{ marginTop: "0.1rem" }}>
                        <Input.TextArea
                          placeholder="Write something about yourself..."
                          value={bioText}
                          onChange={(e) => setBioText(e.target.value)}
                          style={{ resize: "none" }}
                          rows={3}
                        />
                        <Button
                          type="primary"
                          onClick={() => {
                            updateBioMutation({
                              id: user?.id,
                              bio: bioText,
                            });
                          }}
                          style={{ marginTop: "0.5rem" }}
                          loading={isUpdatingBio}
                        >
                          Update Bio
                        </Button>
                      </div>
                    ) : (
                      data?.data?.bio && (
                        <Text className={"typoBody1"} style={{ marginTop: "0.5rem" }}>
                          {data?.data?.bio}
                        </Text>
                      )
                    )}
                  </>
                ) : (
                  <Skeleton style={{ width: "9rem" }} paragraph={{ rows: 2 }} />
                )}
              </div>
            </div>
          </div>

          {/* right side */}
          <div className={css.right}>
            <div className={css.tabs}>
              <Tabs
                centered
                defaultActiveKey={selectedTab}
                onChange={(key) => setSelectedTab(key)}
                items={TABS.map((tab, i) => {
                  const id = String(i + 1);
                  return {
                    key: id,
                    label: (
                      <Flex align="center" gap={".5rem"}>
                        <Icon icon={tab.icon} width={"20px"} />
                        <span className="typoSubtitle2">{tab.label}</span>
                      </Flex>
                    ),
                  };
                })}
              />
            </div>
          </div>
        </div>
      </Box>
    </div>
  );
};

export default ProfileHead;
