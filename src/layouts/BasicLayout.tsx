/**
 * Ant Design Pro v4 use `@ant-design/pro-layout` to handle Layout.
 * You can view component api by:
 * https://github.com/ant-design/ant-design-pro-layout
 */
import ProLayout, {
  MenuDataItem,
  BasicLayoutProps as ProLayoutProps,
  DefaultFooter,
  SettingDrawer,
  PageLoading,
  getMenuData,
} from '@ant-design/pro-layout';
import { formatMessage } from 'umi-plugin-react/locale';
import React, { useEffect, useState } from 'react';
import { Link } from 'umi';
import { Dispatch } from 'redux';
import { connect } from 'dva';
import { GithubOutlined } from '@ant-design/icons';
import { Result, Button } from 'antd';
import classNames from 'classnames';

import Authorized from '@/utils/Authorized';
import RightContent from '@/components/GlobalHeader/RightContent';
import { UmiChildren } from '@/components/RouteTabs/data';
import { ConnectState } from '@/models/connect';
import { isAntDesignPro, getAuthorityFromRouter, isProductionEnv } from '@/utils/utils';
import { setAuthority } from '@/utils/authority';
import { DefaultSettings } from '@/../config/defaultSettings';
import RouteTabsLayout from './RouteTabsLayout';
import logo from '../assets/logo.svg';
import styles from './BasicLayout.less';

const noMatch = (
  <Result
    status={403}
    title="403"
    subTitle="Sorry, you are not authorized to access this page."
    extra={
      <Button type="primary">
        <Link to="/user/login">Go Login</Link>
      </Button>
    }
  />
);

export interface BasicLayoutProps extends ProLayoutProps {
  breadcrumbNameMap: {
    [path: string]: MenuDataItem;
  };
  route: ProLayoutProps['route'] & {
    authority: string[];
  };
  settings: DefaultSettings;
  dispatch: Dispatch;
}

export type BasicLayoutContext = { [K in 'location']: BasicLayoutProps[K] } & {
  breadcrumbNameMap: {
    [path: string]: MenuDataItem;
  };
};

/**
 * use Authorized check all menu item
 */
const menuDataRender = (menuList: MenuDataItem[]): MenuDataItem[] =>
  menuList.map(item => {
    const localItem = {
      ...item,
      children: item.children ? menuDataRender(item.children) : [],
    };
    return Authorized.check(item.authority, localItem, null) as MenuDataItem;
  });

const defaultFooterDom = (
  <DefaultFooter
    copyright="2019 蚂蚁金服体验技术部出品"
    links={[
      {
        key: 'Ant Design Pro',
        title: 'Ant Design Pro',
        href: 'https://pro.ant.design',
        blankTarget: true,
      },
      {
        key: 'github',
        title: <GithubOutlined />,
        href: 'https://github.com/ant-design/ant-design-pro',
        blankTarget: true,
      },
      {
        key: 'Ant Design',
        title: 'Ant Design',
        href: 'https://ant.design',
        blankTarget: true,
      },
    ]}
  />
);

export const footerRender = () => {
  if (!isAntDesignPro()) {
    return defaultFooterDom;
  }

  return (
    <>
      {defaultFooterDom}
      <div
        style={{
          padding: '0px 24px 24px',
          textAlign: 'center',
        }}
      >
        <a href="https://www.netlify.com" target="_blank" rel="noopener noreferrer">
          <img
            src="https://www.netlify.com/img/global/badges/netlify-color-bg.svg"
            width="82px"
            alt="netlify logo"
          />
        </a>
      </div>
    </>
  );
};

const BasicLayout: React.FC<BasicLayoutProps> = props => {
  const {
    dispatch,
    children,
    location = {
      pathname: '/',
    },
    settings: initSettings,
  } = props;

  const [settings, setSettings] = useState<DefaultSettings>(initSettings);
  const [menuLoading, setMenuLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setMenuLoading(false);
    }, 2000);
  }, []);

  useEffect(() => {
    if (dispatch) {
      dispatch({
        type: 'user/fetchCurrent',
      });
    }
  }, []);

  const handleMenuCollapse = (payload: boolean): void => {
    if (dispatch) {
      dispatch({
        type: 'global/changeLayoutCollapsed',
        payload,
      });
    }
  };

  if (isProductionEnv()) {
    setAuthority('admin');
  }

  // get children authority
  const authorized = isProductionEnv()
    ? { authority: ['admin'] }
    : getAuthorityFromRouter(props.route.routes, location.pathname || '/') || {
        authority: undefined,
      };

  console.log(props.navTheme);
  return (
    <ProLayout
      className={settings.routeTabsMode && styles.customByPageTabs}
      logo={logo}
      formatMessage={formatMessage}
      menuRender={(_, dom) =>
        menuLoading ? (
          <div
            className={classNames(
              styles.menuLoading,
              styles[`menu-background-${props.settings.navTheme || 'dark'}`],
            )}
          >
            <PageLoading />
          </div>
        ) : (
          dom
        )
      }
      menuHeaderRender={(logoDom, titleDom) => (
        <Link to="/">
          {logoDom}
          {titleDom}
        </Link>
      )}
      onCollapse={collapsed => {
        if (menuLoading) return;
        handleMenuCollapse(collapsed);
      }}
      menuItemRender={(menuItemProps, defaultDom) => {
        if (menuItemProps.isUrl || menuItemProps.children || !menuItemProps.path) {
          return defaultDom;
        }

        return <Link to={menuItemProps.path}>{defaultDom}</Link>;
      }}
      breadcrumbRender={(routers = []) => [
        {
          path: '/',
          breadcrumbName: '首页',
        },
        ...routers,
      ]}
      itemRender={(route, params, routes, paths) => {
        const first = routes.indexOf(route) === 0;
        return first ? (
          <Link to={paths.join('/')}>{route.breadcrumbName}</Link>
        ) : (
          <span>{route.breadcrumbName}</span>
        );
      }}
      style={{ paddingLeft: 0 }}
      footerRender={false}
      menuDataRender={menuDataRender}
      rightContentRender={() => <RightContent />}
      {...props}
      {...settings}
    >
      <Authorized authority={authorized!.authority} noMatch={noMatch}>
        <RouteTabsLayout
          mode={settings.routeTabsMode!}
          fixedPageTabs={settings.fixedPageTabs}
          menuLoading={menuLoading}
          originalMenuData={
            getMenuData(props.route.routes!, { locale: true }, formatMessage).menuData
          }
        >
          {children as UmiChildren}
        </RouteTabsLayout>
      </Authorized>
      <SettingDrawer
        settings={settings}
        onSettingChange={config => {
          console.log(config);
          setSettings(config as DefaultSettings);
        }}
      />
    </ProLayout>
  );
};

export default connect(({ global, settings }: ConnectState) => ({
  collapsed: global.collapsed,
  settings,
}))(BasicLayout);
