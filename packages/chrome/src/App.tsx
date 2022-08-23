import React, {createContext, lazy, useEffect, useState} from 'react';
import {Navigate, Route, Routes, useNavigate} from 'react-router-dom';
import AppLayout from './components/AppLayout';
import {withSus} from './components/TheSuspense';

import './App.css';
import {fetchPassword} from "./utils/auth";
import CreateNewWallet from "./pages/OnBoarding/CreateNewWallet";
import {ToastContainer} from "react-toastify";
import './styles/react-toastify.scss';

const MainPage = lazy(() => import('./pages/MainPage'));
const WelcomePage = lazy(() => import('./pages/OnBoarding/Welcome'));
const SettingPage = lazy(() => import('./pages/SettingsPage'));
const SendPage = lazy(() => import('./pages/SendPage'));
const TransacationFlowPage = lazy(() => import('./pages/TransactionFlow'));
const TransacationDetail = lazy(
  () => import('./pages/TransactionFlow/transactionDetail')
);

export interface AppContextParams {
  password: string;
  setPassword: (val: string) => void;
}

export const AppContext = createContext<AppContextParams>({
  password: '',
  setPassword: () => {},
});

function App() {
  // const navigate = useNavigate();
  const [appContext, setAppContext] = useState({
    password: '',
    setPassword,
  })

  function setPassword(value: string) {
    setAppContext((state) => ({
      ...state,
      password: value,
    }))
  }

  // async function checkLoginStatus() {
  //   const password = await fetchPassword();
  //   if (!password) {
  //     navigate('onboard');
  //     return;
  //   }
  //   setPassword(password);
  // }

  useEffect(() => {
    (async function () {
      // await checkLoginStatus();
    })();
  }, [])

  // const contextClass: Record<string, any> = {
  //   success: "bg-blue-600",
  //   error: "bg-red-600",
  //   info: "bg-gray-600",
  //   warning: "bg-orange-400",
  //   default: "bg-indigo-600",
  //   dark: "bg-white-600 font-gray-300",
  // };

  return (
    <AppContext.Provider value={appContext}>
      <div className="app">
        <Routes>
          <Route path="/" element={<AppLayout/>}>
            <Route index element={<Navigate to="/home"/>}/>
            <Route path="home" element={withSus(<MainPage/>)}/>
            <Route path={'send'} element={withSus(<SendPage/>)}/>
            <Route
              path="transaction/flow"
              element={withSus(<TransacationFlowPage/>)}
            />
            <Route
              path="transaction/detail/:id"
              element={withSus(<TransacationDetail/>)}
            />
            <Route path="settings/*" element={withSus(<SettingPage/>)}/>
          </Route>
          <Route path={'onboard'}>
            <Route index element={<Navigate to="/onboard/welcome"/>}/>
            <Route path="welcome" element={withSus(<WelcomePage />)}/>
            <Route path="create-new-wallet" element={withSus(<CreateNewWallet />)}/>
          </Route>
        </Routes>
        <ToastContainer />
      </div>
    </AppContext.Provider>
  );
}

export default App;
