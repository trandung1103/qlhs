import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { StudentsPage } from './features/students/StudentsPage';

function App() {
  return (
    <ConfigProvider locale={viVN} theme={{ token: { colorPrimary: '#1677ff' } }}>
      <StudentsPage />
    </ConfigProvider>
  );
}

export default App;
