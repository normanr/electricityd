#!/usr/bin/python

import collections
import StringIO
import imp
electricityd = imp.load_source('electricityd', 'electricityd')
import mock
import unittest
import sys
import time


def make_request(cls, path, method='GET'):
    buf = StringIO.StringIO('%s %s HTTP/1.1' % (method, path))
    outbuf = StringIO.StringIO()
    buf.write = outbuf.write
    mock_request = mock.Mock()
    mock_request.makefile.return_value = buf
    handler = cls(mock_request, ('', 0), None)
    out = outbuf.getvalue()
    if '\r\n\r\n' in out:
        return out.split('\r\n\r\n', 1)
    else:
        return out, None


@mock.patch('time.time', return_value=2700)
class electricitydTest(unittest.TestCase):

    def setUp(self):
        electricityd.config = dict(
            httpServerRoot=None,
            logFile='/dev/stderr',
            logTimeFormat='%b %_2d %H:%M:%S',
        )
        electricityd.log = collections.deque([])
        electricityd.readings = dict(
            temp=23.4,
            watts=56.7,
            joules=890.1,
            relative_humidity=34.5,
        )

    def test_handleVariableResponse(self, mock_time):
        # requests used by mrtg
        headers, body = make_request(electricityd.httpRequestHandler,
            '/joules/int,0,,.txt')
        self.assertTrue(headers.startswith('HTTP/1.0 200 '), msg=headers)
        self.assertEqual(body, '890\r\n0\r\n\r\n\r\n')

        headers, body = make_request(electricityd.httpRequestHandler,
            '/temp/int.txt')
        self.assertTrue(headers.startswith('HTTP/1.0 200 '), msg=headers)
        self.assertEqual(body.rstrip(), '23')

        # requests used by cacti
        headers, body = make_request(electricityd.httpRequestHandler,
            '/joules/int,temp.cacti')
        self.assertTrue(headers.startswith('HTTP/1.0 200 '), msg=headers)
        self.assertEqual(body.rstrip(), 'joules/int:890 temp:23.4')

        headers, body = make_request(electricityd.httpRequestHandler,
            '/temp,relative_humidity.cacti')
        self.assertTrue(headers.startswith('HTTP/1.0 200 '), msg=headers)
        self.assertEqual(body.rstrip(), 'temp:23.4 relative_humidity:34.5')

        # requests used by webcam
        headers, body = make_request(electricityd.httpRequestHandler,
            '/temp,watts.csv')
        self.assertTrue(headers.startswith('HTTP/1.0 200 '), msg=headers)
        self.assertEqual(body.rstrip(), '23.4,56.7')

        # testing division
        headers, body = make_request(electricityd.httpRequestHandler,
            '/joules/3.6.csv')
        self.assertTrue(headers.startswith('HTTP/1.0 200 '), msg=headers)
        self.assertEqual(body.rstrip(), '247.25')


if __name__ == '__main__':
  unittest.main()
