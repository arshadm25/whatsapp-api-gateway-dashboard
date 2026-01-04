import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Inbox from './pages/Inbox';
import Contacts from './pages/Contacts';
import Broadcast from './pages/Broadcast';
import Automation from './pages/Automation';
import Media from './pages/Media';
import Flows from './pages/Flows';
import FlowPlayground from './pages/FlowPlayground';
import Templates from './pages/Templates';
import Chatbot from './pages/Chatbot';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Inbox />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="broadcast" element={<Broadcast />} />
          <Route path="templates" element={<Templates />} />
          <Route path="automation" element={<Automation />} />
          <Route path="chatbot" element={<Chatbot />} />
          <Route path="media" element={<Media />} />
          <Route path="flows" element={<Flows />} />
          <Route path="playground" element={<FlowPlayground />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
