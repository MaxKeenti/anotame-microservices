using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Anotame.Models
{
    public class Response
    {
        public object AllOk()
        {
            ResponseProperties cn = new ResponseProperties
            {
                MethodSuccess = true,
                Message = "Datos Insertados Correctamente",
                Status = 200
            };

            return cn;
        }

        public object WentBad()
        {
            ResponseProperties cn = new ResponseProperties
            {
                MethodSuccess = false,
                Message = "Datos No Insertados",
                Status = 900
            };

            return cn;
        }
        public object RepeatedData()
        {
            ResponseProperties cn = new ResponseProperties
            {
                MethodSuccess = false,
                Message = "Datos No Insertados, el registro ya fue insertado anteriormente",
                Status = 800
            };

            return cn;
        }

        public ServerErrorProperties ServerError(string url, string mensaje = "")
        {
            ServerErrorProperties cn = new ServerErrorProperties
            {
                IsServerError = true,
                UrlError = url,
                Mensaje = mensaje
            };

            return cn;
        }
    }

    public class ResponseProperties
    {
        public bool MethodSuccess { get; set; }
        public int Status { get; set; }
        public string Message { get; set; }
    }

    public class ServerErrorProperties
    {
        public bool IsServerError { get; set; }
        public string UrlError { get; set; }
        public string Mensaje { get; set; }
    }
}